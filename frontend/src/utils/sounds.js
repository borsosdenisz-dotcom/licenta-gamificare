export const playSound = (type) => {
  const sounds = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    questDone: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.2;
  audio.play().catch(() => {});
};