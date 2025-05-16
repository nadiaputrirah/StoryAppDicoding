import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as StoryAppAPI from '../../data/api';

export default class HomePage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section id="map-section">
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title-homepage">Daftar Story</h1>

        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Deteksi jika sedang offline
    if (!navigator.onLine) {
      this.showOfflinePrompt();
      return;
    }

    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAppAPI,
    });

    await this.#presenter.initialGalleryAndMap();
  }

  populateStoriesList(message, stories) {
    if (!Array.isArray(stories) || stories.length === 0) {
      this.populateStoriesListEmpty();
      return;
    }

    const html = stories.reduce((accumulator, story) => {
      if (this.#map && typeof story.lat === 'number' && typeof story.lon === 'number') {
        const coordinate = [story.lat, story.lon];
        const markerOptions = { alt: story.name || 'Untitled' };
        const popupOptions = { content: story.name || 'No title' };
        this.#map.addMarker(coordinate, markerOptions, popupOptions);
      }

      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          reporterName: story.name,
        }),
      );
    }, '');

    document.getElementById('stories-list').innerHTML = `
      <div class="stories-list">${html}</div>
    `;
  }

  populateStoriesListEmpty() {
    document.getElementById('stories-list').innerHTML = generateStoriesListEmptyTemplate();
  }

  populateStoriesListError(message) {
    document.getElementById('stories-list').innerHTML = generateStoriesListErrorTemplate(message);
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 10,
      locate: true,
    });
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    document.getElementById('stories-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = '';
  }

  // PROMPT MODE OFFLINE
  showOfflinePrompt() {
    // Sembunyikan elemen map-section
    const mapSection = document.getElementById('map-section');
    if (mapSection) mapSection.style.display = 'none';

    // Prompt offline
    const container = document.querySelector('.stories-list__container');
    container.innerHTML = `
      <div class="offline-prompt">
        <h2>Anda sedang offline. Ingin mengakses mode offline?</h2>
        <button id="offline-mode-btn" class="offline-button">Mode Offline</button>
      </div>
    `;

    document.getElementById('offline-mode-btn').addEventListener('click', () => {
      window.location.hash = '#/bookmark';
    });
  }

}
