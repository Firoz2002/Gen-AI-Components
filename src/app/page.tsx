"use client";
//import ImageEditor from '@/components/editors/ImageEditor';
import AddBlog from '@/components/modals/AddBlog';
import { useState } from 'react';


type ImageResponse = {
  b64_json: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState<string>('');
  const [data, setData] = useState<ImageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/ai-agent/image-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Image generation failed');
      }

      const json: ImageResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>AI Image Generator</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your image..."
        rows={4}
        style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
      />
      <button
        onClick={handleSubmit}
        style={{
          marginTop: 10,
          padding: '10px 20px',
          fontSize: 16,
          borderRadius: 6,
          backgroundColor: '#4f46e5',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Submit'}
      </button>

      {error && (
        <div style={{ marginTop: 10, color: 'red' }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: 20 }}>
          <h3>Generated Image:</h3>
          <img
            src={`data:image/png;base64,${data.b64_json}`}
            alt="Generated"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        </div>
      )}
    <AddBlog open={true} onOpenChange={() => {}} onSubmit={async () => {}}/>
    </div>
  );
}