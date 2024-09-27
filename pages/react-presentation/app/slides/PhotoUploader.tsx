/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  Suspense,
} from 'react';
import './PhotoUploader.module.css';
import DebugInfo from '../components/DebugInfo';
import { observer } from '@legendapp/state/react';
import { appState } from '../state/appState';
import { useDropzone } from 'react-dropzone';
import {
  bulkAddPhotos,
  getAllStoredFiles,
  uploadFile,
  generateUniqueFileName,
  updatePhotoAsUploaded,
  getBlobForPhoto,
  getPhotoDB,
  initializePhotoCaptureDB,
  getAWSPathForPhoto,
  generateUniqueFileId,
} from '../utilities/FileUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LazyLoad from 'react-lazyload';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SearchIcon from '../components/SearchIcon';
import TrafficLightIndicator from '../components/TrafficLightIndicator';
import PhotoDisplay from '../components/PhotoDisplay';
import {
  MAX_FILE_SIZE,
  sanitizeBytesToMBAndGB,
  sanitizeName,
  readFileAsDataURL,
  resizeImage,
  MAX_IMAGE_SIZE,
} from '../utilities/FileUtils';
import { LoadingSpinner } from '../components/Loader';
import { Section } from '../types';

interface PhotoFile {
  file: File[];
  preview: string;
  thumbnail?: string;
  caption?: string;
  thumbnailPreview?: string;
}

interface PhotoUploaderProps {
  recordId: string;
}

// We'll keep the photoGroups array for reference, but we won't use it in the UI
const photoGroups = [
  // ... (keep the existing photoGroups array as is)
];

const photoCaptureSectionsRaw: Section[] = [
  {
    title: 'House Picture (10ft)',
    id: 'house-photo-10ft',
    group: 'General',
    description: 'Take a clear photo of the house from 10ft away',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'House Left',
    id: 'house-photo-left',
    group: 'General',
    description: 'Take a clear photo of the left side of the house',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'House Right',
    id: 'house-photo-right',
    group: 'General',
    description: 'Take a clear photo of the right side of the house',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'House Back',
    id: 'house-photo-back',
    group: 'General',
    description: 'Take a clear photo of the back side of the house',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'House Street View',
    id: 'house-street-view',
    group: 'General',
    description:
      'Take clear photos of the house from the street e.g. from the mailbox',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Service Panel (2 ft)',
    id: 'service-panel-2ft',
    group: 'Electrical',
    description: 'Take a clear photo of the service panel from 2ft away',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Meter Close (2 ft)',
    id: 'meter-close-2ft',
    group: 'Electrical',
    description: 'Take a clear photo of the meter from 2ft away (close-up)',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Meter Far (6ft)',
    id: 'meter-far-6ft',
    group: 'Electrical',
    description: 'Take a clear photo of the meter from 6ft away',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Main Panel - Sticker/catalogue on panel door',
    id: 'main-panel-sticker',
    group: 'Electrical',
    description:
      'Take a clear photo of the sticker/catalogue on the main panel door',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Main Panel - Surrounding area of 6ft around',
    id: 'main-panel-surrounding',
    group: 'Electrical',
    description:
      'Take a clear photo of the surrounding area of 6ft around the main panel',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Main Breaker Rating',
    id: 'main-breaker-rating',
    group: 'Electrical',
    description: 'Take a clear photo of the main breaker rating',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Attic Access',
    id: 'attic-access',
    group: 'Roof',
    description: 'Take a clear photo of the attic access',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Long Photo of Attic w/flash',
    id: 'attic-long-photo',
    group: 'Roof',
    description: 'Take a clear photo of the attic with flash',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Rafter Size',
    id: 'rafter-size',
    group: 'Roof',
    description: 'Take a clear photo of the rafter size in the attic',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Rafter Spacing',
    id: 'rafter-spacing',
    group: 'Roof',
    description: 'Take a clear photo of the rafter spacing in the attic',
    captures: [{ type: 'photo', minimumPhotos: 3 }],
  },
  {
    title: 'Shading Challenges',
    id: 'shading-challenges',
    group: 'Miscellaneous',
    description:
      'Take a clear photo of any and all shading challenges e.g. trees, buildings, etc.',
    captures: [{ type: 'photo', minimumPhotos: 1 }],
  },
  {
    title: 'Other House Photos',
    id: 'other-house-photos',
    group: 'Miscellaneous',
    description: 'Take any other photos of the house',
    captures: [{ type: 'photo', minimumPhotos: 1 }],
  },
  {
    title: 'Other Electrical Service Photos',
    id: 'other-electrical-service-photos',
    group: 'Electrical',
    description: 'Take any other photos of the electrical service',
    captures: [{ type: 'photo', minimumPhotos: 1 }],
  },
  {
    title: 'HOA Documents',
    id: 'hoa-documents',
    group: 'HOA',
    description: 'Take photos of any relevant HOA documents',
    captures: [{ type: 'photo', minimumPhotos: 1 }],
  },
];

const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 100;
        const MAX_HEIGHT = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const PhotoUploader: React.FC<PhotoUploaderProps> = observer(() => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordId = appState.recordId.get();

  const {
    executeAction: getPhotosForRecord,
    result: salesforcePhotoMetadata,
    loading: isLoadingSalesforcePhotos,
  } = useDirectSalesforceAction<any[]>(
    'PatterPhotoUploadService.getPhotosForRecord',
    { recordId: recordId }
  );

  const { executeAction: getOpportunityDetails, result: opportunityDetails } =
    useDirectSalesforceAction<any>(
      'PatterPhotoUploadService.getOpportunityDetails',
      { recordId: recordId }
    );

  const { executeAction: uploadFilesToSalesforce } =
    useDirectSalesforceAction<any>(
      'PatterPhotoUploadService.uploadFilesToSalesforce',
      {}
    );

  const location = useLocation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Handle the dropped files here
    const fileList = new DataTransfer();
    acceptedFiles.forEach((file) => fileList.items.add(file));
    handlePhotoInputChange(
      {
        target: { files: fileList.files },
      } as React.ChangeEvent<HTMLInputElement>,
      ''
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    const init = async () => {
      try {
        if (appState.recordId.get()) {
          setIsPageLoading(true);
          await initializePhotoCaptureDB(appState.recordId.get());
          const [details, photos] = await Promise.all([
            getOpportunityDetails(),
            getPhotosForRecord(),
          ]);
          appState.opportunityDetails.set(details);
          appState.salesforcePhotos.set(photos);
          console.log('Opportunity Details:', details);

          if (navigator.storage && navigator.storage.estimate) {
            const { usage, quota } = await navigator.storage.estimate();
            appState.storageUsage.set(sanitizeBytesToMBAndGB(usage || 0));
            appState.storageLimit.set(sanitizeBytesToMBAndGB(quota || 0));
          }

          await updateUI();
        } else {
          console.error('No recordId found in URL parameters');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsPageLoading(false);
      }
    };

    init();
  }, [recordId]);

  const updateUI = async () => {
    const [hasStoredFiles, processedSections] = await Promise.all([
      getHasStoredFiles(),
      getProcessedPhotoCaptureSections(),
    ]);
    appState.hasStoredFiles.set(hasStoredFiles);
    appState.photoCaptureSections.set(processedSections as any);
  };

  const getHasStoredFiles = async () => {
    try {
      const db = await getPhotoDB();
      if (db) {
        const count = await db.countByIndex(
          'recordId',
          appState.recordId.get()
        );
        return count > 0;
      }
    } catch (error) {
      console.error('Error checking for stored files:', error);
    }
    return false;
  };

  const getProcessedPhotoCaptureSections = async () => {
    let sections =
      appState.selectedSection.get() !== 'All'
        ? photoCaptureSectionsRaw.filter(
            (section) => section.id === appState.selectedSection.get()
          )
        : photoCaptureSectionsRaw;

    if (appState.searchQuery.get()) {
      const searchLower = appState.searchQuery.get().toLowerCase();
      sections = sections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchLower) ||
          section.description.toLowerCase().includes(searchLower)
      );
    }

    const db = await getPhotoDB();
    let storedFiles =
      (await db?.findByIndex('recordId', appState.recordId.get())) || [];
    storedFiles = await Promise.all(
      storedFiles.map(async (file: any) => ({
        ...file,
        awsPath: await getAWSPathForPhoto(file),
        dataUrl: file.dataUrl || (await getBlobForPhoto(file.id)),
        uniqueId: generateUniqueFileId(file),
        isLocal: true, // Mark local files
      }))
    );

    const salesforcePhotos = (appState.salesforcePhotos.get() || []).map(
      (photo: any) => ({
        ...photo,
        isLocal: false, // Mark Salesforce files
      })
    );

    return sections.map((section) => {
      const sanitizedTitle = sanitizeName(section.title);
      const sanitizedGroup = sanitizeName(section.group);
      const sectionName = sanitizedGroup + '-' + sanitizedTitle;

      const localFiles = storedFiles.filter(
        (file: any) => file.sectionName === sectionName
      );
      const salesforceFiles = salesforcePhotos
        .filter((photo: any) => photo.sectionName === sectionName)
        .map((photo: any) => ({
          ...photo,
          uniqueId: generateUniqueFileId(photo),
        }));

      const sectionPhotos = mergeAndDedupFiles(localFiles, salesforceFiles);

      return {
        ...section,
        sanitizedName: sanitizedGroup + '-' + sanitizedTitle,
        storedFiles: sectionPhotos,
        fulfilled: section.captures.every(
          (capture) => sectionPhotos.length >= capture.minimumPhotos
        ),
        captures: section.captures.map((capture, index2) => ({
          ...capture,
          id: `${section.id}-${index2}`,
          index: `${section.id}-${index2}-${capture.type}-${section.title}`,
          isPhoto: capture.type === 'photo',
          sectionName: sectionName,
          name: `${sectionName}-${sanitizeName(capture.type)}-${index2}`,
        })),
      };
    });
  };

  useEffect(() => {
    if (!isPageLoading) {
      const updateSections = async () => {
        const processedSections = await getProcessedPhotoCaptureSections();
        appState.photoCaptureSections.set(processedSections as any);
      };
      updateSections();
    }
  }, [
    isPageLoading,
    appState.selectedSection.get(),
    appState.searchQuery.get(),
    appState.salesforcePhotos.get(),
  ]);

  const mergeAndDedupFiles = (localFiles: any[], salesforceFiles: any[]) => {
    const allFiles = [...localFiles, ...salesforceFiles];
    const uniqueFiles = allFiles.reduce((acc, current) => {
      const existingFile = acc.find(
        (item: any) => item.fileName === current.fileName
      );
      if (!existingFile) {
        return acc.concat([current]);
      } else {
        // If the file already exists, prefer the local version
        return acc.map((item: any) =>
          item.fileName === current.fileName && !item.isLocal ? current : item
        );
      }
    }, []);
    return uniqueFiles;
  };

  const handleSectionClick = (sectionId: string) => {
    // Scroll to the selected section
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        const sectionRect = sectionElement.getBoundingClientRect();
        const mainContentRect = mainContent.getBoundingClientRect();
        mainContent.scrollTo({
          top: sectionRect.top - mainContentRect.top + mainContent.scrollTop,
          behavior: 'smooth',
        });
      }
    }
  };

  const handlePhotoInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    sectionName: string
  ) => {
    event.stopPropagation();
    const element = event.target;

    console.log('handlePhotoInputChange triggered');
    console.log('Event:', event);
    console.log('Element:', element);
    console.log('Section Name:', sectionName);

    if (!event || !element) {
      console.error('Event or element is null');
      return;
    }

    const filesToUpload = element.files;

    console.log('Files to upload:', filesToUpload);
    console.log('Number of files:', filesToUpload?.length);

    // Check if running on iOS
    const isIOS =
      // @ts-expect-error - navigator.userAgent is not typed
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    console.log('Is iOS device:', isIOS);

    if (filesToUpload && filesToUpload.length > 0) {
      for (let i = 0; i < filesToUpload.length; i++) {
        console.log(
          `File ${i + 1}:`,
          JSON.stringify({
            name: filesToUpload[i].name,
            type: filesToUpload[i].type,
            size: filesToUpload[i].size,
          })
        );
      }
    } else {
      console.warn('No files selected');
    }

    try {
      if (filesToUpload) {
        const filesWithThumbnails = await Promise.all(
          Array.from(filesToUpload).map(async (file) => {
            const thumbnail = await generateThumbnail(file);
            return { file, thumbnail, sectionName }; // Include sectionName here
          })
        );
        await enqueueFileUpload(filesWithThumbnails);
      }
    } catch (error) {
      console.error('Error in enqueueFileUpload:', error);
      // Handle the error appropriately, maybe show a message to the user
    } finally {
      // Reset the file input
      element.value = '';
      console.log('File input reset. New value:', element.value);
    }
  };

  const enqueueFileUpload = async (
    filesWithThumbnails: {
      file: File;
      thumbnail: string;
      sectionName: string;
    }[]
  ) => {
    console.log('enqueueFileUpload started');

    if (filesWithThumbnails.length === 0) {
      console.warn('No files found for processing.');
      return;
    }

    console.log('Files array length:', filesWithThumbnails.length);

    appState.setIsUploading(true);

    const filesWithDataUrl = await Promise.all(
      filesWithThumbnails.map(
        async ({ file, thumbnail, sectionName }, index) => {
          console.log(`Processing file ${index + 1}:`, file.name);

          if (!file.name) {
            console.error('File skipped due to missing name:', file);
            return null;
          }
          try {
            const dataUrl = await readFileAsDataURL(file);
            console.log(`File ${index + 1} read successfully:`, file.name);

            const fileName = generateUniqueFileName(sectionName, file.name);
            const uniqueId = `${sectionName}-${fileName}`;

            // Create a new object for upload progress if it doesn't exist
            appState.setUploadProgress({
              ...appState.uploadProgress.get(),
              [uniqueId]: { status: 'queued', progress: 0 },
            } as any);

            return {
              fileName: fileName,
              dataUrl: dataUrl,
              thumbnail: thumbnail,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              lastModifiedDate: (file as any).lastModifiedDate,
              webkitRelativePath: file.webkitRelativePath,
              uniqueId: uniqueId,
              isUploading: true,
              uploadProgress: 0,
              sectionName: sectionName,
            };
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            return null;
          }
        }
      )
    );

    const validFilesWithDataUrl = filesWithDataUrl.filter(
      (file) => file !== null
    ) as any[];

    const processedFilesData = validFilesWithDataUrl.map((file, index) => ({
      ...file,
      recordId: appState.recordId.get(),
      timestamp: Date.now(),
      index,
      uploaded: false, // Initially set to false
    }));

    // Immediately add photos to local storage and update UI
    await bulkAddPhotos(processedFilesData);
    await updateUI();

    // Asynchronously upload to Salesforce
    if (navigator.onLine) {
      console.log('Online! Uploading files to Salesforce...');
      uploadLocalFiles().catch((error) => {
        console.error('Error uploading files to Salesforce:', error);
        toast.error(
          'Failed to upload some files to Salesforce. They will be retried later.'
        );
      });
    } else {
      console.log('Offline! Files will be uploaded to Salesforce when online.');
    }

    appState.setIsUploading(false);
  };

  const uploadLocalFiles = async () => {
    appState.setIsUploading(true);

    const photos = await getAllStoredFiles();
    const uploadPromises = photos
      .filter((photo: { uploaded: any }) => !photo.uploaded)
      .map(async (photo: { id: string; fileName: any }) => {
        try {
          const blob = await getBlobForPhoto(photo.id);
          if (blob) {
            const result = await uploadFile(photo, uploadFilesToSalesforce);
            appState.setUploadProgress({
              ...appState.uploadProgress.get(),
              [photo.id]: { status: 'uploaded', progress: 100 },
            } as any);
            await updatePhotoAsUploaded(photo.id);
            return result;
          } else {
            throw new Error(`No data found for photo ${photo.fileName}`);
          }
        } catch (error) {
          console.error(`Failed to upload photo ${photo.fileName}:`, error);
          appState.setUploadProgress({
            ...appState.uploadProgress.get(),
            [photo.id]: { status: 'failed', progress: 0 },
          } as any);
          throw error;
        }
      });

    try {
      await Promise.all(uploadPromises);
      await loadSalesforcePhotos();
      await updateUI();
    } catch (error) {
      console.error('Error uploading local files:', error);
      toast.error('Failed to upload some files. They will be retried later.');
    } finally {
      appState.setIsUploading(false);
    }
  };

  const updateFileUploadProgress = (fileId: string, progress: number) => {
    appState.photoCaptureSections.set(
      appState.photoCaptureSections.get().map(
        (section) =>
          ({
            ...section,
            storedFiles: section.storedFiles?.map((file: any) =>
              file.uniqueId === fileId
                ? {
                    ...file,
                    uploadProgress: progress,
                    uploadProgressStyle: `width: ${progress}%`,
                    isUploading: progress < 100,
                    uploadStatus:
                      progress < 100 ? `Uploading: ${progress}%` : 'Uploaded',
                  }
                : file
            ),
          } as any)
      )
    );
  };

  const loadSalesforcePhotos = async () => {
    try {
      const photos = await getPhotosForRecord();
      appState.salesforcePhotos.set(photos);
      await updateUI();
    } catch (error) {
      console.error('Error loading Salesforce photos:', error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    appState.setSelectedImageUrl(imageUrl);
    appState.setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    appState.setShowImagePopup(false);
    appState.setSelectedImageUrl('');
  };

  // if (isPageLoading) {
  //   return (
  //     <div className="loader-container">
  //       <div className="loader"></div>
  //     </div>
  //   );
  // }

  return (
    <Suspense
      fallback={
        <LoadingSpinner isLoading={isPageLoading} message="Loading Photos" />
      }
    >
      <motion.div
        className="photocapture-app-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.aside
          className="photocapture-sidebar"
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="search-bar">
            <div className="search-input-container">
              <SearchIcon />
              <motion.input
                type="search"
                placeholder="Search sections"
                value={appState.searchQuery.get()}
                onChange={(e) => appState.setSearchQuery(e.target.value)}
                whileFocus={{ scale: 1.05 }}
              />
            </div>
            {/* {appState.searchQuery.get() && (
            <motion.button
              onClick={() => appState.setSearchQuery('')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Clear
            </motion.button>
          )} */}
          </div>
          <ul className="captures-list">
            {appState.photoCaptureSections
              .get()
              .filter(
                (section) =>
                  section.title
                    .toLowerCase()
                    .includes(appState.searchQuery.get().toLowerCase()) ||
                  section.description
                    .toLowerCase()
                    .includes(appState.searchQuery.get().toLowerCase())
              )
              .map((section) => (
                <motion.li
                  key={section.id}
                  className={`captures-list-item ${
                    appState.selectedSection.get() === section.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleSectionClick(section.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{section.title}</span>
                  <motion.div
                    className="status-icon"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* <TrafficLightIndicator
                      completedPhotos={section.storedFiles?.length ?? 0}
                      requiredPhotos={section.captures[0].minimumPhotos}
                    /> */}
                    {/* <TrafficLightIndicator
                          completedPhotos={section.storedFiles?.length || 0}
                          requiredPhotos={section.captures[0].minimumPhotos}
                        /> */}

                    <div
                      style={{
                        height: '16px',
                        width: '16px',
                        border: '1px solid #E6E6E6',
                        color: '#4CAF50',
                      }}
                    >
                      {section.fulfilled ? (
                        <svg
                          fill="#4CAF50"
                          focusable="false"
                          aria-hidden="true"
                          viewBox="0 0 520 520"
                          lwc-1e39mgvor8u=""
                          data-key="check"
                        >
                          <g lwc-1e39mgvor8u="">
                            <path
                              d="M191 425L26 259c-6-6-6-16 0-22l22-22c6-6 16-6 22 0l124 125a10 10 0 0015 0L452 95c6-6 16-6 22 0l22 22c6 6 6 16 0 22L213 425c-6 7-16 7-22 0z"
                              lwc-1e39mgvor8u=""
                            ></path>
                          </g>
                        </svg>
                      ) : (
                        <svg
                          fill="#E6E6E6"
                          focusable="false"
                          aria-hidden="true"
                          viewBox="0 0 520 520"
                          lwc-4g1ccmaiue=""
                          data-key="record"
                        >
                          <g lwc-4g1ccmaiue="">
                            <path
                              d="M260 80a180 180 0 110 360 180 180 0 010-360z"
                              lwc-4g1ccmaiue=""
                            ></path>
                          </g>
                        </svg>
                      )}
                    </div>
                  </motion.div>
                </motion.li>
              ))}
          </ul>
        </motion.aside>
        <motion.div
          className="main-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* <motion.button
          onClick={() =>
            appState.showDebugInfo.set(!appState.showDebugInfo.get())
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Toggle Debug Info
        </motion.button> */}
          {/* <motion.div 
          {...getRootProps() as any} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p>Drop the files here ...</p> :
              <p>Drag 'n' drop some files here, or click to select files</p>
          }
        </motion.div> */}
          <motion.div
            className="captures-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isLoadingSalesforcePhotos ? (
              <motion.div
                className="spinner"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <div className="spinner-icon"></div>
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  {appState.searchQuery.get() &&
                    appState.photoCaptureSections.get().length === 0 && (
                      <motion.div
                        className="no-results-message"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        No results found for "{appState.searchQuery.get()}"
                      </motion.div>
                    )}
                </AnimatePresence>
                {appState.photoCaptureSections.get().map((section: Section) => (
                  <motion.div
                    key={section.id}
                    id={section.id}
                    className="photo-capture-section"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="section-header">
                      <motion.h2
                        className="section-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {section.title}
                      </motion.h2>
                      <motion.p
                        className="section-description"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {section.description}
                      </motion.p>
                      {/* <motion.div
                        className="section-status-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <TrafficLightIndicator
                          completedPhotos={section.storedFiles?.length || 0}
                          requiredPhotos={section.captures[0].minimumPhotos}
                        />
                        <p
                          className={`section-status ${
                            section.fulfilled ? 'complete' : 'incomplete'
                          }`}
                        >
                          Status:{' '}
                          {section.fulfilled ? 'Complete' : 'Incomplete'}
                          <div style={{
                            height: '16px',
                            width: '16px',
                            border: '1px solid #4CAF50',
                            color: '#4CAF50',
                          }}>
                          <svg fill='#4CAF50' focusable="false" aria-hidden="true" viewBox="0 0 520 520" part="icon" lwc-1e39mgvor8u="" data-key="check" class="slds-icon slds-icon-text-success slds-icon_xx-small"><g lwc-1e39mgvor8u=""><path d="M191 425L26 259c-6-6-6-16 0-22l22-22c6-6 16-6 22 0l124 125a10 10 0 0015 0L452 95c6-6 16-6 22 0l22 22c6 6 6 16 0 22L213 425c-6 7-16 7-22 0z" lwc-1e39mgvor8u=""></path></g></svg>
                          </div>
                        </p>
                      </motion.div> */}
                    </div>
                    <div className="section-content">
                      {section.captures.map((capture: any) => (
                        <motion.div
                          key={capture.id}
                          className="photo-capture"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="upload-container">
                            <motion.button
                              className="upload-button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const fileInput = document.getElementById(
                                  `${capture.id}-file-input`
                                ) as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              Upload Photos
                              {/* ({section.storedFiles?.length || 0}/
                              {capture.minimumPhotos} required) */}
                            </motion.button>
                            <input
                              type="file"
                              id={`${capture.id}-file-input`}
                              accept="image/*"
                              onChange={(e) =>
                                handlePhotoInputChange(
                                  e,
                                  section.sanitizedName!
                                )
                              }
                              multiple
                              style={{ display: 'none' }}
                            />
                          </div>
                          <motion.div
                            className="uploaded-images"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {(section.storedFiles || []).map((file: any) => (
                              <LazyLoad key={file.uniqueId} height={200} once>
                                <PhotoDisplay
                                  file={file}
                                  onClick={handleImageClick}
                                />
                              </LazyLoad>
                            ))}
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {appState.showImagePopup.get() && (
            <motion.div
              className="image-popup-overlay"
              onClick={closeImagePopup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="image-popup-content"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <img
                  src={appState.selectedImageUrl.get()}
                  alt="Enlarged view"
                  className="enlarged-image"
                />
                <motion.button
                  className="close-button"
                  onClick={closeImagePopup}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <ToastContainer />
      </motion.div>
    </Suspense>
  );
});

export default PhotoUploader;
