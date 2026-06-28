import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { anthropic } from '@/lib/anthropic'
import { buildInterviewContext } from '@/lib/interview-prompt'
import { computeDeliveryMetrics } from '@/lib/delivery'

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const formData = await req.formData()
    const questionNumber = Number(formData.get('questionNumber'))
    const videoBlob = formData.get('video') as Blob | null

    if (!questionNumber || !videoBlob) {
      return NextResponse.json({ error: 'Missing questionNumber or video.' }, { status: 400 })
    }

    const supabase = supabaseAdmin

    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .select('role, difficulty, language, num_questions, user_id, track_id, company_id, round_type, seniority, job_title, job_description, resume_snapshot, tracks(name, category), companies(name, interview_style_notes)')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer())
    const videoPath = `${session.user_id}/${sessionId}/q${questionNumber}.webm`
    let videoResponseUrl: string | null = null

    const { error: uploadErr } = await supabase.storage
      .from('interview-video')
      .upload(videoPath, videoBuffer, { contentType: 'video/webm', upsert: true })

    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('interview-video').getPublicUrl(videoPath)
      videoResponseUrl = urlData.publicUrl
    } else {
      console.error('[video-interview/answer] upload error:', uploadErr)
    }

    // Deepgram can transcribe video/webm (it extracts the audio track)
    let transcript = ''
    let audioDuration: number | null = null
    try {
      const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en-IN&smart_format=true&filler_words=true', {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'video/webm',
        },
        body: videoBuffer,
      })
      const dgJson = await dgRes.json()
      transcript = dgJson?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
      audioDuration = typeof dgJson?.metadata?.duration === 'number' ? dgJson.metadata.duration : null
    } catch (e) {
      console.error('[video-interview/answer] Deepgram error:', e)
    }

    const metrics = computeDeliveryMetrics(transcript, audioDuration)

    await supabase
      .from('session_questions')
      .update({
        transcript,
        video_response_url: videoResponseUrl,
        answer_duration_seconds: metrics.durationSeconds,
        words_per_minute: metrics.wpm,
        filler_count: metrics.fillerCount,
        filler_words: metrics.fillerWords,
      })
      .eq('session_id', sessionId)
      .eq('question_number', questionNumber)

    const isLastQuestion = questionNumber >= session.num_questions

    if (isLastQuestion) {
      await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
      return NextResponse.json({ transcript, nextQuestion: null, isComplete: true })
    }

    const { data: prevQs } = await supabase
      .from('session_questions')
      .select('question_number, question_text, transcript')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true })

    const history = (prevQs ?? [])
      .map(q => `Q${q.question_number}: ${q.question_text}\nA: ${q.transcript ?? '(no answer)'}`)
      .join('\n\n')

    const track = session.tracks as unknown as { name: string; category: string | null } | null
    const company = session.companies as unknown as { name: string; interview_style_notes: string | null } | null
    const seniority = session.seniority ?? session.difficulty
    const context = buildInterviewContext({
      trackName: track?.name ?? session.role,
      category: track?.category,
      companyName: company?.name,
      companyNotes: company?.interview_style_notes,
      roundType: session.round_type,
      seniority,
      jobTitle: session.job_title,
      jobDescription: session.job_description,
      resumeText: session.resume_snapshot,
    })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are an experienced interviewer conducting a mock video interview.
${context}
Language: ${session.language}
Question ${questionNumber} of ${session.num_questions} has just been answered.

Interview so far:
${history}

Generate ONE follow-up interview question (question ${questionNumber + 1} of ${session.num_questions}).
- Build naturally on what was said, or transition to a new relevant topic
- Stay consistent with the round type, seniority${session.job_description ? ' and the target job description' : ''}
- Do NOT repeat a question already asked
- Answerable verbally in 60–90 seconds
- Output ONLY the question text, no preamble, no numbering`,
      }],
    })

    const nextQuestion = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

    await supabase.from('session_questions').insert({
      session_id: sessionId,
      question_number: questionNumber + 1,
      question_text: nextQuestion,
    })

    return NextResponse.json({ transcript, nextQuestion, isComplete: false })
  } catch (err: unknown) {
    console.error('[video-interview/answer]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
