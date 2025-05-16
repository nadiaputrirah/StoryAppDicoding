import { storyMapper } from '../../data/api-mapper';
import * as StoryAppAPI from '../../data/api';

export default class StoryDetailPresenter {
  #storyId;
  #view;
  #apiModel;
  #dbModel;

  constructor(storyId, { view, apiModel, dbModel }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async showStoryDetailMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showStoryDetailMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showStoryDetail() {
  this.#view.showStoryDetailLoading();
  try {
    const response = await this.#apiModel.getStoryById(this.#storyId, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    
    if (!response.ok) {
      this.#view.populateStoryDetailError(response.message);
      return;
    }

    const story = await storyMapper(response.data.story);
    this.#view.populateStoryDetailAndInitialMap(response.message, story);
  } catch (error) {
    this.#view.populateStoryDetailError(error.message);
  } finally {
    this.#view.hideStoryDetailLoading();
  }
}

  async notifyMe() {
    try {
      const response = await this.#apiModel.sendStoryToMeViaNotification(this.#storyId);
      if (!response.ok) {
        console.error('notifyMe: response:', response);
        return;
      }
      console.log('notifyMe:', response.message);
    } catch (error) {
      console.error('notifyMe: error:', error);
    }
  }

  async saveStory() {
    try {
      const response = await this.#apiModel.getStoryById(this.#storyId);
      
      if (!response.ok) {
        console.error('saveStory: response:', response);
        this.#view.saveToBookmarkFailed(response.message);
        return;
      }

    const originalStory = response.data.story;
    const mappedStory = await storyMapper(originalStory);
    const storyToSave = {
      id: originalStory.id,
      ...originalStory,
      ...mappedStory,  
      reporter: { name: originalStory.name || 'Unknown Reporter' },
      savedAt: Date.now(),
    };

    // Tambahkan log di sini
    console.log('this.#storyId saat save:', this.#storyId);
    console.log('story disimpan ID-nya:', storyToSave.id);

    await this.#dbModel.putStory(storyToSave);
    console.log('story disimpan ke bookmark:', storyToSave);

    this.#view.saveToBookmarkSuccessfully('Success to save to bookmark');

    await this.showSaveButton();

    } catch (error) {
      console.error('saveStory: error:', error);
      this.#view.saveToBookmarkFailed(error.message);
    }
  }

  async removeStory() {
    try {
      await this.#dbModel.removeStory(this.#storyId);
      this.#view.removeFromBookmarkSuccessfully('Success to remove from bookmark');
    } catch (error) {
      console.error('removeStory: error:', error);
      this.#view.removeFromBookmarkFailed(error.message);
    }
  }
 
  async showSaveButton() {
    if (await this.#isStorySaved()) {
      this.#view.renderRemoveButton();  
      return;
    } 

    this.#view.renderSaveButton();  
  }
  
  async #isStorySaved() {
     return !!(await this.#dbModel.getStoryById(this.#storyId));
  }
}
