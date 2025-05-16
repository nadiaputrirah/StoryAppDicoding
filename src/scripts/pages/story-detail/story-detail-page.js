import {
  generateCommentsListEmptyTemplate,
  generateCommentsListErrorTemplate,
  generateLoaderAbsoluteTemplate,
  generateRemoveStoryButtonTemplate,
  generateStoryCommentItemTemplate,
  generateStoryDetailErrorTemplate,
  generateSaveStoryButtonTemplate,
  generateStoryDetailTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import * as StoryAppAPI from '../../data/api';
import Map from '../../utils/map';
import Database from '../../data/database';

export default class StoryDetailPage {
  #presenter = null;
  #form = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="story-detail__container">
          <div id="story-detail" class="story-detail"></div>
          <div id="story-detail-loading-container"></div>
        </div>
      </section>
      
      <section class="container">
        <div class="story-detail__comments__container">
          <div class="story-detail__comments-form__container"> 
            <form id="comments-list-form" class="story-detail__comments-form__form">   
            </form>
          </div>
          <div class="story-detail__comments-list__container">
            <div id="story-detail-comments-list"></div>
            <div id="comments-list-loading-container"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new StoryDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: StoryAppAPI,
      dbModel: Database,
    });

    this.#setupForm();

    this.#presenter.showStoryDetail();
    this.#presenter.getCommentsList?.(); 
  }

  async populateStoryDetailAndInitialMap(message, story) {
    console.log('Story detail:', story);
  
    document.getElementById('story-detail').innerHTML = generateStoryDetailTemplate({
      name: story.name,
      description: story.description,
      photoUrl: story.photoUrl,
      reporterName: story.name,
      location: story.location,
      createdAt: story.createdAt,
    });
  
    createCarousel(document.getElementById('images'));
  
    await this.#presenter.showStoryDetailMap();
  
    if (this.#map && story.location) {
      const storyCoordinate = [story.location.latitude, story.location.longitude];
      const markerOptions = { alt: story.name };
      const popupOptions = { content: story.name };
  
      this.#map.changeCamera(storyCoordinate);
      this.#map.addMarker(storyCoordinate, markerOptions, popupOptions);
    }
  
    // Update elemen info detail setelah map
    const latEl = document.getElementById('location-latitude');
    if (latEl) latEl.textContent = `Latitude: ${story.location?.latitude ?? 'Tidak tersedia'}`;
  
    const lonEl = document.getElementById('location-longitude');
    if (lonEl) lonEl.textContent = `Longitude: ${story.location?.longitude ?? 'Tidak tersedia'}`;
  
    const placeNameEl = document.getElementById('location-place-name');
    if (placeNameEl) placeNameEl.textContent = `📍 ${story.location?.placeName ?? 'Tidak diketahui'}`;
  
    const authorEl = document.getElementById('author');
    if (authorEl) authorEl.textContent = `Ditulis oleh: ${story.name ?? 'Tidak diketahui'}`;
  
    const createdAtEl = document.getElementById('createdat');
    if (createdAtEl) {
    const formattedDate = new Date(story.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    createdAtEl.textContent = `📅 ${formattedDate}`;
  }

    // Tombol simpan & event listener
    this.#presenter.showSaveButton();
    this.addNotifyMeEventListener();
  }
  
  populateStoryDetailError(message) {
    document.getElementById('story-detail').innerHTML =
      generateStoryDetailErrorTemplate(message);
  }

  populateStoryDetailComments(message, comments) {
    if (comments.length <= 0) {
      this.populateCommentsListEmpty();
      return;
    }

    const html = comments.reduce(
      (accumulator, comment) =>
        accumulator.concat(
          generateStoryCommentItemTemplate({
            photoUrlCommenter: comment.commenter.photoUrl,
            nameCommenter: comment.commenter.name,
            body: comment.body,
          }),
        ),
      '',
    );

    document.getElementById('story-detail-comments-list').innerHTML = `
      <div class="story-detail__comments-list">${html}</div>
    `;
  }

  populateCommentsListEmpty() {
    document.getElementById('story-detail-comments-list').innerHTML =
      generateCommentsListEmptyTemplate();
  }

  populateCommentsListError(message) {
    document.getElementById('story-detail-comments-list').innerHTML =
      generateCommentsListErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
    });
  }

  #setupForm() {
    this.#form = document.getElementById('comments-list-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        body: this.#form.elements.namedItem('body').value,
      };
      await this.#presenter.postNewComment?.(data);
    });
  }

  postNewCommentSuccessfully(message) {
    console.log(message);
    this.#presenter.getCommentsList?.();
    this.clearForm();
  }

  postNewCommentFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  

renderSaveButton() {
  const container = document.getElementById('save-actions-container');
  console.log('Container saat renderSaveButton:', container);

  const template = generateSaveStoryButtonTemplate();
  console.log('Template tombol save:', template);

  container.innerHTML = template;

  const saveButton = document.getElementById('story-detail-save');
  console.log('Tombol Save ditemukan:', saveButton);

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      console.log('Tombol save diklik!');
      await this.#presenter.saveStory();
      // await this.#presenter.showRemoveButton(); 
    });
  } else {
    console.warn('Tombol Save tidak ditemukan setelah render!');
  }
}


  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }

  renderRemoveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateRemoveStoryButtonTemplate();
 
    document.getElementById('story-detail-remove').addEventListener('click', async () => {
      await this.#presenter.removeStory();
      await new Promise(resolve => setTimeout(resolve, 100)); // delay 100ms
      await this.#presenter.showSaveButton();
    });
  }
  
  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }
  removeFromBookmarkFailed(message) {
    alert(message);
  }

  addNotifyMeEventListener() {
    document.getElementById('story-detail-notify-me').addEventListener('click', () => {
        this.#presenter.notifyMe();
    });
  }

  // Tambahan untuk menangani loading state dari presenter
  showStoryDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideStoryDetailLoading() {
    document.getElementById('story-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) {
      container.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }
  
  hideMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  showCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML = '';
  }


}
