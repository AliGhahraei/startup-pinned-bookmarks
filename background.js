const BOOKMARK_FOLDER_NAME = "Startup Tabs";

async function getStartupBookmarks() {
  try {
    const allBookmarks = await browser.bookmarks.getTree();

    function findFolder(node) {
      if (node.title === BOOKMARK_FOLDER_NAME && node.children) {
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
    console.error("Error accessing bookmarks:", error);
    return [];
  }
}

async function openStartupPinnedTabs() {
  const bookmarks = await getStartupBookmarks();
  if (bookmarks.length === 0) {
    console.warn("No bookmarks found in Startup Tabs folder.");
    return;
  }

  const [currentWindow] = await browser.windows.getAll({ populate: true });

  // First, open all startup tabs as pinned
  const createdTabs = [];
  for (let i = 0; i < bookmarks.length; i++) {
    const bm = bookmarks[i];
    if (!bm.url) continue;

    const tab = await browser.tabs.create({
      windowId: currentWindow.id,
      url: bm.url,
      pinned: true,
      active: i === 0 // Focus the first tab
    });
    createdTabs.push(tab.id);
  }

  // Now, close any pre-existing tabs
  const unwantedTabIds = currentWindow.tabs.map(tab => tab.id);
  console.log("Removing: ", unwantedTabIds)
  if (unwantedTabIds.length > 0) {
    await browser.tabs.remove(unwantedTabIds);
  }
}

browser.runtime.onStartup.addListener(() => {
  openStartupPinnedTabs();
});
