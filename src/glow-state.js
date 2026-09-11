// Cards and audio have separate lifetimes: closing the player does not pause audio.
export function glowTargets({educationOpen, musicOpen, paused, ended, error}) {
  const playing = !paused && !ended && !error;
  return {education: educationOpen ? 1 : 0, music: playing ? 1 : musicOpen ? .35 : 0};
}
