/// <reference lib="webworker" />

import { CvParserService } from './cv-parser.service';

/**
 * Web Worker for CV parsing
 * Processes CV files off the main thread to prevent UI blocking
 */
addEventListener('message', async ({ data }) => {
  try {
    const { file: fileData } = data;

    // Convert back to File object
    const file = new File([fileData.data], fileData.name, { type: fileData.type });

    // Parse the file
    const parser = new CvParserService();
    const profile = await parser.parseFile(file);

    postMessage({
      success: true,
      data: profile
    });
  } catch (error) {
    postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});
