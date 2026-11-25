const SOURCES = [
  { name: 'LinkedIn', hosts: ['linkedin.com', 'lnkd.in'] },
  { name: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { name: 'Medium', hosts: ['medium.com'] },
];

/**
 * Names the site a post link points to, e.g. "LinkedIn" for lnkd.in links.
 * @param {string} href The post URL
 * @returns {string} The source name, or '' for unknown or same-site links
 */
function getSourceName(href) {
  try {
    const host = new URL(href, window.location).hostname.replace(/^www\./, '');
    const source = SOURCES.find(({ hosts }) => hosts
      .some((h) => host === h || host.endsWith(`.${h}`)));
    return source ? source.name : '';
  } catch {
    return '';
  }
}

function isDate(text) {
  const value = text.trim();
  return value.length > 0 && value.length < 40 && /\d/.test(value) && !Number.isNaN(Date.parse(value));
}

function wrap(element, className) {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  element.before(wrapper);
  wrapper.append(element);
  return wrapper;
}

function decorateMedia(media, source, heading) {
  media.className = 'posts-media';
  if (media.querySelector('picture, img')) {
    media.classList.add('posts-media-image');
    return;
  }

  // the text tile is decorative; the heading carries the meaning
  media.setAttribute('aria-hidden', 'true');
  const mark = document.createElement('div');
  mark.className = 'posts-media-mark';
  const lines = [...media.children];
  if (lines.length) {
    mark.append(...lines);
  } else if (heading) {
    mark.textContent = heading.textContent;
  }
  if (source) {
    const label = document.createElement('div');
    label.className = 'posts-media-source';
    label.textContent = source;
    media.append(label);
  }
  media.append(mark);
}

function decorateCard(row) {
  row.className = 'posts-card';
  row.setAttribute('role', 'listitem');
  const cells = [...row.children];
  const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
  const body = cells.find((cell) => heading && cell.contains(heading)) || cells[cells.length - 1];
  if (!body) return;
  body.className = 'posts-body';

  const link = body.querySelector('a[href]');
  const source = link ? getSourceName(link.href) : '';

  const date = [...body.querySelectorAll('p')]
    .find((p) => !p.querySelector('a') && isDate(p.textContent));
  if (date || source) {
    const meta = document.createElement('div');
    meta.className = 'posts-meta';
    if (source) {
      const label = document.createElement('span');
      label.className = 'posts-source';
      label.textContent = source;
      meta.append(label);
    }
    if (date) {
      date.before(meta);
      meta.append(date);
    } else {
      body.prepend(meta);
    }
  }

  if (link) {
    wrap(link.closest('p') || link, 'posts-action');
    const title = heading ? heading.textContent.trim() : '';
    if (title) {
      link.setAttribute('aria-label', `${link.textContent.trim()}${source ? ` on ${source}` : ''}: ${title}`);
    }
    if (new URL(link.href, window.location).origin !== window.location.origin) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    row.classList.add('posts-card-linked');
  }

  let media = cells.find((cell) => cell !== body);
  if (!media) {
    media = document.createElement('div');
    row.prepend(media);
  }
  decorateMedia(media, source, heading);
}

/**
 * Decorates a list of post cards. Each row is one post: an optional tile cell
 * (short lines of text, or an image) and a cell with the date, heading,
 * summary and link.
 * @param {Element} block The posts block element
 */
export default function decorate(block) {
  block.setAttribute('role', 'list');
  [...block.children].forEach(decorateCard);
}
