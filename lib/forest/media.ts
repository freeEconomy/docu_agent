// Pre-rendered, licensed video assets only. Never generate video at runtime.
// Keys are lesson IDs; each entry is a chapter index (starting at 0).
// Add files under public/story-videos and register their local paths here.
export type StoryVideo = { src: string; poster?: string; captions?: string };
export const storyVideos: Partial<Record<string, Partial<Record<number, StoryVideo>>>> = {};
