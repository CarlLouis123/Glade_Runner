export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextureEntry {
  image: HTMLImageElement | null;
  frame: SpriteFrame;
}

interface SpriteAtlasData {
  image?: string | null;
  frames: Record<string, SpriteFrame>;
}

interface AudioOptions {
  loop?: boolean;
  volume?: number;
}

class AudioManager {
  private context: AudioContext | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();

  private async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  }

  async load(key: string, url: string): Promise<void> {
    const ctx = await this.ensureContext();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    this.buffers.set(key, buffer);
  }

  async play(key: string, options: AudioOptions = {}): Promise<void> {
    const buffer = this.buffers.get(key);
    if (!buffer) {
      return;
    }
    const ctx = await this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;

    const gain = ctx.createGain();
    gain.gain.value = options.volume ?? 1;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
}

class ResourceManager {
  private readonly textures = new Map<string, TextureEntry>();
  private readonly audio = new AudioManager();

  async loadJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${url}`);
    }
    return (await response.json()) as T;
  }

  async loadImage(url: string): Promise<HTMLImageElement> {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      image.src = url;
    });
  }

  async loadSpriteAtlas(key: string, url: string): Promise<void> {
    try {
      const atlas = await this.loadJSON<SpriteAtlasData>(url);
      let image: HTMLImageElement | null = null;
      const source = atlas.image ?? null;
      if (source && !source.startsWith('@')) {
        try {
          image = await this.loadImage(source);
        } catch (error) {
          console.warn('Sprite atlas image missing, using fallback rectangles.', error);
        }
      }
      for (const frameKey of Object.keys(atlas.frames)) {
        const frame = atlas.frames[frameKey];
        this.registerTexture(frameKey, image, frame);
      }
    } catch (error) {
      console.warn(`Unable to load sprite atlas ${key}`, error);
    }
  }

  registerTexture(key: string, image: HTMLImageElement | null, frame: SpriteFrame): void {
    this.textures.set(key, { image, frame });
  }

  getTexture(key: string): TextureEntry | undefined {
    return this.textures.get(key);
  }

  async loadAudio(key: string, url: string): Promise<void> {
    await this.audio.load(key, url);
  }

  async playAudio(key: string, options: AudioOptions = {}): Promise<void> {
    await this.audio.play(key, options);
  }
}

export const resources = new ResourceManager();
export const loadJSON = async <T>(url: string): Promise<T> => await resources.loadJSON<T>(url);
export const loadImage = async (url: string): Promise<HTMLImageElement> =>
  await resources.loadImage(url);
