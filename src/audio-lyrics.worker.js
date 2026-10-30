import { env, pipeline } from '@huggingface/transformers'
import { transliterate } from 'transliteration'

env.allowLocalModels = false
env.allowRemoteModels = true

let transcriberPromise = null

const getTranscriber = () => {
  if (!transcriberPromise) {
    self.postMessage({ type: 'status', status: 'loading-model', message: 'Preparing high-accuracy multilingual model…' })
    transcriberPromise = pipeline('automatic-speech-recognition', 'onnx-community/whisper-small', {
      dtype: 'q8',
      progress_callback: progress => {
        if (progress.status === 'progress') {
          self.postMessage({
            type: 'progress',
            progress: Math.max(1, Math.round(progress.progress || 0)),
            message: `Downloading ${progress.file || 'speech model'}…`,
          })
        }
      },
    }).then(transcriber => {
      self.postMessage({ type: 'model-ready' })
      return transcriber
    })
  }
  return transcriberPromise
}

self.addEventListener('message', async event => {
  if (event.data?.type !== 'transcribe') return
  try {
    const transcriber = await getTranscriber()
    self.postMessage({ type: 'status', status: 'transcribing', message: `Listening with ${event.data.language === 'auto' ? 'automatic detection' : `${event.data.language} as the primary language`}…` })
    const options = {
      task: 'transcribe',
      return_timestamps: true,
      chunk_length_s: 15,
      stride_length_s: 3,
      condition_on_prev_tokens: false,
      compression_ratio_threshold: 2.4,
      logprob_threshold: -1,
      no_speech_threshold: 0.6,
    }
    if (event.data.language && event.data.language !== 'auto') options.language = event.data.language
    const output = await transcriber(event.data.audio, options)
    const romanize = value => transliterate(String(value || ''), { trim: false, unknown: '' })
    self.postMessage({
      type: 'result',
      output: {
        text: romanize(output?.text),
        chunks: Array.isArray(output?.chunks) ? output.chunks.map(chunk => ({
          text: romanize(chunk.text),
          timestamp: Array.isArray(chunk.timestamp) ? chunk.timestamp : [0, 0],
        })) : [],
      },
    })
  } catch (error) {
    transcriberPromise = null
    self.postMessage({ type: 'error', message: error?.message || 'The audio could not be transcribed.' })
  }
})
