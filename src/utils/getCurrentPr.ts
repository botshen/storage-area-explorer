export function getCurrentPr(
  window: Pick<Window, "location"> = globalThis.window,
): number | undefined {
  const [_, prNumber] =
    window.location.pathname.match(/\/pull\/([0-9]+?)(\/|$)/) ?? [];

  return prNumber ? Number(prNumber) : undefined;
}
