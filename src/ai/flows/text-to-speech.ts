
'use server';

/**
 * @fileOverview A Genkit flow for generating speech from text.
 *
 * This flow takes a text string as input and returns a base64-encoded WAV audio file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

export type TextToSpeechInput = string;
export type TextToSpeechOutput = {
  media: string;
};

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  const TextToSpeechInputSchema = z.string();
  const TextToSpeechOutputSchema = z.object({
    media: z.string().describe("A base64 encoded WAV audio data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
  });

  const textToSpeechFlow = ai.defineFlow(
    {
      name: 'textToSpeechFlow',
      inputSchema: TextToSpeechInputSchema,
      outputSchema: TextToSpeechOutputSchema,
    },
    async (query: string) => {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: query,
      });
      if (!media) {
        throw new Error('no media returned');
      }
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      return {
        media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
      };
    }
  );

  return textToSpeechFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
