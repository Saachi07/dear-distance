'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TipTapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, Heading1, Heading2, 
  List, ListOrdered, Quote,
  Image as ImageIcon, Mic, Video, Music
} from 'lucide-react'
import { useState, useRef } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface LetterEditorProps {
  content: string
  onChange: (content: string) => void
  onMediaAdd?: (media: { type: string; url: string }) => void
}

export function LetterEditor({ content, onChange, onMediaAdd }: LetterEditorProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const supabase = createSupabaseClient()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-rose-gold underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your letter here... Pour your heart out 💕',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  })

  const uploadMedia = async (file: File, type: 'photo' | 'video') => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${type}s/${fileName}`

      const { error } = await supabase.storage
        .from('dear-distance-media')
        .upload(filePath, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('dear-distance-media')
        .getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      if (type === 'photo' && editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }

      onMediaAdd?.({ type, url: publicUrl })
      return publicUrl
    } catch (error) {
      console.error('Error uploading media:', error)
      alert('Failed to upload media')
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      uploadMedia(file, 'photo')
    } else if (file.type.startsWith('video/')) {
      uploadMedia(file, 'video')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        await uploadAudio(file)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to start recording')
    }
  }

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setVideoStream(stream)
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        await uploadVideo(file)
        stream.getTracks().forEach(track => track.stop())
        setVideoStream(null)
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecordingVideo(true)
    } catch (error) {
      console.error('Error starting video recording:', error)
      alert('Failed to start video recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
      setIsRecordingVideo(false)
      setMediaRecorder(null)
    }
  }

  const uploadAudio = async (file: File) => {
    try {
      const fileName = `audio-${Date.now()}.webm`
      const filePath = `audio/${fileName}`

      const { error } = await supabase.storage
        .from('dear-distance-media')
        .upload(filePath, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('dear-distance-media')
        .getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      if (editor) {
        editor.chain().focus().insertContent(`
          <div class="audio-player my-4">
            <audio controls src="${publicUrl}" class="w-full"></audio>
          </div>
        `).run()
      }

      onMediaAdd?.({ type: 'audio', url: publicUrl })
    } catch (error) {
      console.error('Error uploading audio:', error)
      alert('Failed to upload audio')
    }
  }

  const uploadVideo = async (file: File) => {
    try {
      const fileName = `video-${Date.now()}.webm`
      const filePath = `videos/${fileName}`

      const { error } = await supabase.storage
        .from('dear-distance-media')
        .upload(filePath, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('dear-distance-media')
        .getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      if (editor) {
        editor.chain().focus().insertContent(`
          <div class="video-player my-4">
            <video controls src="${publicUrl}" class="w-full rounded-lg"></video>
          </div>
        `).run()
      }

      onMediaAdd?.({ type: 'video', url: publicUrl })
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video')
    }
  }

  const addMusicEmbed = () => {
    const url = prompt('Enter Spotify or SoundCloud track URL:')
    if (!url) return

    const spotifyRegex = /spotify\.com\/track\/([a-zA-Z0-9]+)/
    const soundcloudRegex = /soundcloud\.com\/[^/]+\/[^/]+/

    let embedHtml = ''

    if (spotifyRegex.test(url)) {
      embedHtml = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${url.match(spotifyRegex)?.[1]}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    } else if (soundcloudRegex.test(url)) {
      embedHtml = `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>`
    } else {
      alert('Invalid URL. Please use a Spotify or SoundCloud track URL.')
      return
    }

    if (editor) {
      editor.chain().focus().insertContent(`
        <div class="music-embed my-4">
          ${embedHtml}
        </div>
      `).run()
    }

    onMediaAdd?.({ type: 'music_embed', url })
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="border border-vintage-ink/20 rounded-xl overflow-hidden bg-white">
      <div className="border-b border-vintage-ink/20 bg-vintage-paper/30 p-2 flex flex-wrap gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('bold') ? 'bg-rose-gold/20' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('italic') ? 'bg-rose-gold/20' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('heading', { level: 1 }) ? 'bg-rose-gold/20' : ''}`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('heading', { level: 2 }) ? 'bg-rose-gold/20' : ''}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('bulletList') ? 'bg-rose-gold/20' : ''}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('orderedList') ? 'bg-rose-gold/20' : ''}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-rose-gold/10 ${editor.isActive('blockquote') ? 'bg-rose-gold/20' : ''}`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <div className="w-px bg-vintage-ink/20 mx-1" />
        <button
          onClick={handleImageUpload}
          className="p-2 rounded hover:bg-rose-gold/10"
          title="Upload Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          className={`p-2 rounded hover:bg-rose-gold/10 ${isRecording ? 'bg-red-100 animate-pulse' : ''}`}
          title="Record Voice"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          onClick={isRecordingVideo ? stopRecording : startVideoRecording}
          className={`p-2 rounded hover:bg-rose-gold/10 ${isRecordingVideo ? 'bg-red-100 animate-pulse' : ''}`}
          title={isRecordingVideo ? "Stop Recording" : "Record Video"}
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={addMusicEmbed}
          className="p-2 rounded hover:bg-rose-gold/10"
          title="Add Music"
        >
          <Music className="w-4 h-4" />
        </button>
      </div>
      {isRecordingVideo && videoStream && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <video
            ref={videoPreviewRef}
            autoPlay
            muted
            className="w-full max-w-md mx-auto rounded-lg"
          />
          <div className="text-center mt-2">
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Stop Recording
            </button>
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
