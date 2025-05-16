import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoriesListEmptyTemplate,
  generateStoriesListErrorTemplate,
} from '../../templates';
import BookmarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import Map from '../../utils/map';

 
export default class BookmarkPage {
  presenter = null;
  #map = null; 

  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
 
      <section class="container">
        <h1 class="section-title">Story Tersimpan</h1>
 
        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="stories-list-loading-container"></div>
        </div>
      </section>
    `;
  }
 
  async afterRender() {
      this.presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });
    await this.presenter.initialGalleryAndMap();
  }
 
  populateBookmarkedStories(message, stories) {
  if (stories.length <= 0) {
    this.populateBookmarkedStoriesListEmpty();
    return;
  }

  const html = stories.reduce((accumulator, story) => {
    if (this.#map) {
      const coordinate = [story.location.latitude, story.location.longitude];
      const markerOptions = { alt: story.title };
      const popupOptions = { content: story.title };
      this.#map.addMarker(coordinate, markerOptions, popupOptions);
    }

    return accumulator.concat(
      generateStoryItemTemplate({
        ...story,
        placeNameLocation: story.location ? story.location.placeName : 'Unknown Location',
        reporterName: story.reporter ? story.reporter.name : 'Unknown Reporter',
      }),
    );
  }, '');

  document.getElementById('stories-list').innerHTML = `
    <div class="stories-list">${html}</div>
  `;
}
 
  populateBookmarkedStoriesListEmpty() {
    document.getElementById('stories-list').innerHTML = generateStoriesListEmptyTemplate();
  }
 
  populateBookmarkedStoriesError(message) {
    document.getElementById('stories-list').innerHTML = generateStoriesListErrorTemplate(message);
  }
 
  showStoriesListLoading() {
    document.getElementById('stories-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }
 
  hideStoriesListLoading() {
    document.getElementById('stories-list-loading-container').innerHTML = '';
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
}