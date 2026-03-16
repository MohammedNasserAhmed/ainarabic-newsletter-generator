import React from 'react';

export const QuoteBlock = ({ children, author, role }) => {
  return (
    <div className="quote-block">
      <blockquote className="quote-text">
        {children}
      </blockquote>
      {(author || role) && (
        <div className="quote-attribution sans-text">
          {author && <span className="quote-author">{author}</span>}
          {role && <span className="quote-role">{role}</span>}
        </div>
      )}
    </div>
  );
};

export const ImageWithCaption = ({ src, alt, caption }) => {
  return (
    <figure className="image-figure">
      <div className="image-wrapper">
        <img src={src} alt={alt || caption} loading="lazy" />
      </div>
      {caption && (
        <figcaption className="image-caption sans-text">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
