/**
 * Entry point for the roaming pet window.
 *
 * The pet window is a separate, tiny, transparent Tauri window that lives on
 * top of the desktop. The notebook window creates it with the pet id in the
 * URL query string, for example `pet.html?pet=cat`.
 *
 * Step 1 only: this is a placeholder so the window has something to show.
 * The roaming + dragging behaviour lands in step 2 (the spike).
 */
console.log("pet window loaded", window.location.search);
