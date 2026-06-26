import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const formData = await req.formData()
    const questionNumber = Number(formData.get('questionNumber'))
    const audioBlob = formData.get('audio') as Blob | null

    if (!questionNumber || !audioBlob) {
      return NextResponse.json({ error: 'Missing questionNumber or audio.' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Fetch session to get context
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .select('role, difficulty, language, num_questions, user_id')
      .eq('id', sessionId)
      .single()

    if (sessErr || !session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
    }

    // Upload audio to Supabase storage
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer())
    const audioPath = `${session.user_id}/${sessionId}/q${questionNumber}.webm`
    let audioResponseUrl: string | null = null

    const { error: uploadErr } = await supabase.storage
      .from('interview-audio')
      .upload(audioPath, audioBuffer, { contentType: 'audio/webm', upsert: true })

    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from('interview-audio').getPublicUrl(audioPath)
      audioResponseUrl = urlData.publicUrl
    }

    // Transcribe via Deepgram
    let transcript = ''
    try {
      const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en-IN&smart_format=true', {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm',
        },
        body: audioBuffer,
      })
      const dgJson = await dgRes.json()
      transcript = dgJson?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
    } catch (e) {
      console.error('[answer] Deepgram error:', e)
    }

    // Update question row with transcript and audio URL
    await supabase
      .from('session_questions')
      .update({ transcript, audio_response_url: audioResponseUrl })
      .eq('session_id', sessionId)
      .eq('question_number', questionNumber)

    const isLastQuestion = questionNumber >= session.num_questions

    if (isLastQuestion) {
      await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
      return NextResponse.json({ transcript, nextQuestion: null, isComplete: true })
    }

    // Fetch all Q&A so far for context
    const { data: prevQs } = await supabase
      .from('session_questions')
      .select('question_number, question_text, transcript')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true })

    const history = (prevQs ?? [])
      .map(q => `Q${q.question_number}: ${q.question_text}\nA: ${q.transcript ?? '(no answer)'}`)
      .join('\n\n')

    // Generate next question
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an experienced interviewer conducting a mock interview.
Role: ${session.role}
Experience level: ${session.difficulty}
Language: ${session.language}
Question ${questionNumber} of ${session.num_questions} has just been answered.

Interview so far:
${history}

Generate ONE follow-up interview question (question ${questionNumber + 1} of ${session.num_questions}).
- Build naturally on what was said, or transition to a new relevant topic
- Do NOT repeat a question already asked
- Answerable verbally in 60–90 seconds
- Output ONLY the question text, no preamble, no numbering`,
        },
      ],
    })

    const nextQuestion = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

    // Store next question
    await supabase.from('session_questions').insert({
      session_id: sessionId,
      question_number: questionNumber + 1,
      question_text: nextQuestion,
    })

    return NextResponse.json({ transcript, nextQuestion, isComplete: false })
  } catch (err: unknown) {
    console.error('[answer]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
