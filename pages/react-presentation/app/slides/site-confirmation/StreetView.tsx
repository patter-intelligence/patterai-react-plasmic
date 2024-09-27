import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreetViewProps {
  apiKey: string;
  markerPosition: { lat: number; lng: number };
}

const StreetView: React.FC<StreetViewProps> = memo(({ apiKey, markerPosition }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${markerPosition.lat},${markerPosition.lng}&key=${apiKey}`;

    fetch(streetViewUrl)
      .then((response) => {
        if (
          response.ok &&
          response.headers.get("content-type")?.startsWith("image/")
        ) {
          return streetViewUrl;
        } else {
          return `https://maps.googleapis.com/maps/api/staticmap?center=${markerPosition.lat},${markerPosition.lng}&zoom=20&size=600x300&maptype=satellite&key=${apiKey}&markers=color:red%7C${markerPosition.lat},${markerPosition.lng}`;
        }
      })
      .catch(() => {
        return `https://maps.googleapis.com/maps/api/staticmap?center=${markerPosition.lat},${markerPosition.lng}&zoom=20&size=600x300&maptype=satellite&key=${apiKey}&markers=color:red%7C${markerPosition.lat},${markerPosition.lng}`;
      })
      .then((url) => {
        const img = new Image();
        img.onload = () => {
          setImageUrl(url);
          setIsLoading(false);
        };
        img.src = url;
      });
  }, [apiKey, markerPosition]);

  return (
    <motion.div
      className="house-image"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
      }}
    >
      <AnimatePresence>
        {imageUrl && (
          <motion.img
            key="image"
            src={imageUrl}
            alt="Location view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {isLoading && (
          <div key="loader" className="loader-wrapper visible">
            <div className="loader-container">
              <div className="logo throbbing"></div>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Loading image...
              </motion.p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default StreetView;
