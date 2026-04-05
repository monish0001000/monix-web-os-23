// ─── VFS Node ─────────────────────────────────────────────────────────────────
export interface VFSNode {
  id: string;          // unique path-based id, e.g. "sangeetha_makeover" or "sangeetha_makeover/Screenshot (509).webp"
  name: string;        // display name
  type: "folder" | "file";
  parentId: string;    // "root" for top-level, else parent folder id
  url?: string;        // bundled asset URL (files only)
  ext?: string;        // lowercase extension (files only)
}

// ─── Build tree from Vite glob output ─────────────────────────────────────────
export function buildVFSTree(rawFiles: Record<string, string>): VFSNode[] {
  const nodes: VFSNode[] = [
    { id: "root", name: "storage", type: "folder", parentId: "" },
  ];
  const seenFolders = new Set<string>(["root"]);

  for (const [key, url] of Object.entries(rawFiles)) {
    // Strip the Vite glob prefix to get a relative path
    // Key format: "/src/storage/foo/bar/file.ext"
    const relativePath = key.replace(/^\/src\/storage\//, "");
    if (!relativePath) continue;

    const parts = relativePath.split("/");

    // Ensure every ancestor folder exists
    let parentId = "root";
    for (let i = 0; i < parts.length - 1; i++) {
      const folderPath = parts.slice(0, i + 1).join("/");
      if (!seenFolders.has(folderPath)) {
        nodes.push({
          id: folderPath,
          name: parts[i],
          type: "folder",
          parentId,
        });
        seenFolders.add(folderPath);
      }
      parentId = folderPath;
    }

    // File node
    const fileName = parts[parts.length - 1];
    const dotIdx = fileName.lastIndexOf(".");
    const ext = dotIdx !== -1 ? fileName.slice(dotIdx + 1).toLowerCase() : "";

    nodes.push({
      id: relativePath,
      name: fileName,
      type: "file",
      parentId,
      url,
      ext,
    });
  }

  return nodes;
}

// ─── Run the glob scan (called once at startup) ────────────────────────────────
export function scanStorage(): VFSNode[] {
  // Vite resolves this at build-time; eager:true makes it synchronous
  const rawFiles = import.meta.glob("/src/storage/**/*", {
    query: "?url",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  return buildVFSTree(rawFiles);
}
