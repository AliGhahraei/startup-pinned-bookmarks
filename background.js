const BOOKMARK_FOLDER_NAME = "Startup Tabs";

async function openStartupPinnedTabs() {
  const bookmarks = await getStartupBookmarks();
  if (bookmarks.length === 0) {
    console.warn(`No bookmarks found in ${BOOKMARK_FOLDER_NAME} folder.`);
    return;
  }

  const currentWindow = await browser.windows.getCurrent({ populate: true });
  await openBookmarksAsPinned(bookmarks, currentWindow);
  await removeInitialTabs(currentWindow);
}

async function getStartupBookmarks() {
  const allBookmarks = await browser.bookmarks.getTree();

  function findFolder(node) {
    if (node.title === BOOKMARK_FOLDER_NAME && node.children) {
      return node.children;
    }
    for (const child of node.children || []) {
      const result = findFolder(child);
      if (result) {
        return result
      };
    }
    return null;
  }

  return findFolder(allBookmarks[0]) || [];
}

async function openBookmarksAsPinned(bookmarks, currentWindow) {
  for (let i = 0; i < bookmarks.length; i++) {
    const bm = bookmarks[i];
    if (!bm.url) continue;

    const tab = await browser.tabs.create({
      windowId: currentWindow.id,
      url: bm.url,
      pinned: true,
      active: i === 0 // Focus the first tab
    });
    console.debug("Created tab for url", bm.url)
  }
}

async function removeInitialTabs(currentWindow) {
  const unwantedTabIds = currentWindow.tabs.map(tab => tab.id);
  console.debug("Removing tab IDs: ", unwantedTabIds)
  if (unwantedTabIds.length > 0) {
    await browser.tabs.remove(unwantedTabIds);
  }
}

browser.runtime.onStartup.addListener(() => {
  try {
    openStartupPinnedTabs();
  } catch (error) {
    console.error("Error: ", error);
  }
});
