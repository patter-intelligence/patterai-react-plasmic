import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBlobForPhoto } from '../utilities/FileUtils';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';

interface PhotoDisplayProps {
  file: any;
  onClick: (imageUrl: string) => void;
}

// In-memory cache for Salesforce photos
const salesforcePhotoCache: { [key: string]: string } = {};

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({ file, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { executeAction: getSalesforcePhotoBlob } = useDirectSalesforceAction<string>(
    'PatterPhotoUploadService.getSalesforcePhotoBlob',
    { photoId: file.id }
  );

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      try {
        let blob;
        if (file.isLocal) {
          blob = await getBlobForPhoto(file.id);
        } else {
          // Check if the photo is already in the cache
          if (salesforcePhotoCache[file.id]) {
            blob = salesforcePhotoCache[file.id];
          } else {
            blob = await getSalesforcePhotoBlob({
              photoId: file.id,
            });
            // Store the blob in the cache
            salesforcePhotoCache[file.id] = blob;
          }
          // console.log({blob})
        }
        setImageUrl(blob || file.awsPath);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl(file.awsPath);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [file?.id, file?.isLocal, file?.awsPath]);

  return (
    <motion.div
      className="uploaded-image"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            className="loader-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="loader-spinner">
              <div className="spinner"></div>
            </div>
          </motion.div>
        ) : (
          <motion.img
            key="image"
            src={file.thumbnail || imageUrl}
            alt={file.fileName || 'Uploaded image'}
            className="gallery-image"
            onClick={() => onClick(imageUrl || '')}
            loading="lazy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhotoDisplay;
