export async function simulateTyping(
  text: string,
  setter: (val: string) => void,
  charDelay = 35,
): Promise<void> {
  setter('');
  for (let i = 1; i <= text.length; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, charDelay));
    setter(text.slice(0, i));
  }
}
