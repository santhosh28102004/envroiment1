import { API_BASE_URL } from '../config/api';
const FEATURED_TOPIC_IDS = [
  'climate-change',
  'pollution',
  'deforestation-biodiversity',
  'waste-management',
  'sustainable-living',
  'renewable-energy'
];
const responseCache = new Map();
const inFlightRequests = new Map();

const parseResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || fallbackMessage);
  return data;
};

const fetchJsonOnce = async (path, fallbackMessage) => {
  const url = `${API_BASE_URL}${path}`;

  if (responseCache.has(url)) {
    return responseCache.get(url);
  }

  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url);
  }

  const request = fetch(url)
    .then((response) => parseResponse(response, fallbackMessage))
    .then((data) => {
      responseCache.set(url, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, request);
  return request;
};

export const fetchTopics = async () => {
  const data = await fetchJsonOnce('/topics', 'Failed to load topics');
  return FEATURED_TOPIC_IDS
    .map((id) => data.topics.find((topic) => topic.id === id))
    .filter(Boolean);
};

export const fetchTopicById = async (id) => {
  const data = await fetchJsonOnce(`/topics/${id}`, 'Failed to load topic');
  return data.topic || null;
};

export const fetchArticles = async () => {
  const data = await fetchJsonOnce('/articles', 'Failed to load articles');
  return data.articles || [];
};

export const fetchArticleById = async (id) => {
  const data = await fetchJsonOnce(`/articles/${id}`, 'Failed to load article');
  return data.article || null;
};

export const fetchGalleryImages = async () => {
  const data = await fetchJsonOnce('/gallery', 'Failed to load gallery');
  return data.images || [];
};

export const fetchAwarenessTips = async () => {
  const data = await fetchJsonOnce('/tips', 'Failed to load awareness tips');
  return data.tips || null;
};

export const fetchPageContent = async (slug) => {
  try {
    const data = await fetchJsonOnce(`/pages/${slug}`, 'Failed to load page content');
    return data.page || null;
  } catch {
    return null;
  }
};
