const BOOKMARK_FOLDER_NAME = "Startup Tabs";

async function getStartupBookmarks() {
  try {
    const allBookmarks = await browser.bookmarks.getTree();

    if (!allBookmarks || allBookmarks.length === 0) {
      console.warn("No bookmarks found.");
      return [];
    }

    function findFolder(node) {
      if (node.title === BOOKMARK_FOLDER_NAME && node.children) {
        console.log("Found folder:", node.title);
        return node.children;
      }
      for (const child of node.children || []) {
        const result = findFolder(child);
        if (result) return result;
      }
      return null;
    }

    return findFolder(allBookmarks[0]) || [];
  } catch (error) {
    console.error("Error getting bookmarks:", error);
    return [];
  }
}


async function openPinnedStartupTabs() {
  const bookmarks = await getStartupBookmarks();
  if (bookmarks.length === 0) return;

  const [currentWindow] = await browser.windows.getAll({ populate: true });

  // Close all tabs first
  const tabIds = currentWindow.tabs.map(tab => tab.id);
  await browser.tabs.remove(tabIds);

  // Open each bookmark as a pinned tab
  for (const [index, bm] of bookmarks.entries()) {
    await browser.tabs.create({
      windowId: currentWindow.id,
      url: bm.url,
      pinned: true,
      active: index === 0
    });
  }
}

browser.runtime.onStartup.addListener(() => {
  setTimeout(openPinnedStartupTabs, 1000); // Let Firefox settle first
});
