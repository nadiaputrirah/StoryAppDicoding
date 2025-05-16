import Map from '../utils/map';

export async function storyMapper(story) {
  const latitude = story?.lat;
  const longitude = story?.lon;

  let placeName = '-';

  if (latitude !== undefined && longitude !== undefined) {
    try {
      placeName = await Map.getPlaceNameByCoordinate(latitude, longitude);
    } catch (error) {
      console.error('Gagal mendapatkan nama tempat:', error);
    }
  }

  return {
    ...story,
    location: latitude !== undefined && longitude !== undefined
      ? {
          latitude,
          longitude,
          placeName,
        }
      : null,
  };
}
