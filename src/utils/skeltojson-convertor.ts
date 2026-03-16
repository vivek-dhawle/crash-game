import { SkeletonBinary, AtlasAttachmentLoader } from '@esotericsoftware/spine-pixi-v8';
import { Assets } from 'pixi.js';

export async function downloadJsonFromSkel(skelAlias: any, atlasAlias: any, outputName: any) {
  // 1. Get the raw assets
  const rawBuffer = Assets.get(skelAlias);
  const atlas = Assets.get(atlasAlias);

  if (!rawBuffer || !atlas) {
    console.error('Assets not loaded yet!');
    return;
  }

  // 2. Parse the binary data
  const attachmentLoader = new AtlasAttachmentLoader(atlas);
  const binaryParser = new SkeletonBinary(attachmentLoader);
  const skeletonData = binaryParser.readSkeletonData(rawBuffer);

  // 3. Extract the clean data (Removing circular dependencies)
  // Note: This extracts the structure.
  // If you need every single vertex data point, simple stringify works
  // but might hit circular reference issues without a custom replacer.
  const cleanData = {
    version: skeletonData.version,
    hash: skeletonData.hash,

    // Bones are fine
    bones: skeletonData.bones.map((b) => ({
      name: b.name,
      parent: b.parent ? b.parent.name : null,
    })),

    // FIX: Use 'boneData' and 'attachmentName' here
    slots: skeletonData.slots.map((s) => ({
      name: s.name,
      bone: s.boneData.name, // Changed from s.bone.name
      attachment: s.attachmentName, // Changed from s.attachment.name
    })),

    animations: skeletonData.animations.map((a) => ({ name: a.name })),
    skins: skeletonData.skins.map((s) => ({ name: s.name })),
  };

  // 4. Create the JSON file and trigger download
  const jsonString = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = outputName || 'converted-skeleton.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log('Downloaded:', link.download);
}

// RUN IT:
// downloadJsonFromSkel('spineSkeleton', 'spineAtlas', 'spineboy.json');
