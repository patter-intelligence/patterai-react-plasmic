/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  lazy,
  Suspense,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Loader from "./Loader";
import { eventEmitter } from "../utilities/EventEmitter";

export interface IContentItem {
  type: string;
  styleOverride?: string;
  title?: string;
  imageUrl?: string;
  imageStyle?: string;
  size?: number;
  content?: string | IContentItem[];
  iframeUrl?: string;
  iframeStyle?: string;
  componentName?: string;
  childProps?: Record<string, any>;
  childLayout?: { content: IContentItem[] };
  id?: string;
}

export interface IPresentationData {
  tags?: string;
  template?: string;
  layout: {
    type: string;
    styleOverride?: string;
    content: IContentItem[];
    hasGutters?: boolean;
  };
  order: string;
  name: string;
}

export interface IPresentationSlides {
  slides: IPresentationData[];
}

export interface ContextVariables {
  [key: string]: any;
}

interface DataHook {
  (context: ContextVariables): Promise<any>;
}

interface DataHooks {
  [key: string]: DataHook;
}

const replaceVariables = (text: string, context: ContextVariables): string => {
  return text.replace(
    /\{\{(\w+)\.?(\w+)?\}\}/g,
    (match, variable, property) => {
      if (property) {
        return context[variable]?.[property] || match;
      }
      return context[variable] || match;
    }
  );
};

const parseStyle = (styleString: string) => {
  return styleString.split(";").reduce((acc, style) => {
    const [key, value] = style.split(":").map((s) => s.trim());
    if (key && value) {
      const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      if (key === "background" && value.includes("url(")) {
        // Preserve the entire background value without modification
        acc[camelCaseKey] = value;
      } else {
        acc[camelCaseKey] = value;
      }
    }
    return acc;
  }, {} as Record<string, string>);
};

const componentRegistry: Record<string, React.ComponentType<any>> = {};

const registerComponent = (
  name: string,
  component: React.ComponentType<any>
) => {
  componentRegistry[name] = component;
};

const ImageContent: React.FC<{
  item: IContentItem;
  context: ContextVariables;
}> = ({ item, context }) => {
  const [imageError, setImageError] = useState(false);
  const style = parseStyle(replaceVariables(item.styleOverride || "", context));
  let imageUrl = replaceVariables(item.imageUrl || "", context);
  const imageStyle = parseStyle(
    replaceVariables(item.imageStyle || "", context)
  );

  return (
    <div style={style}>
      {!imageError ? (
        <img
          src={encodeURI(imageUrl)}
          alt={item.title || "Presentation image"}
          style={imageStyle}
          onError={() => {
            console.error("Failed to load image:", imageUrl);
            setImageError(true);
          }}
        />
      ) : (
        <div>Error loading image: {imageUrl}</div>
      )}
    </div>
  );
};

const renderContent = (
  item: IContentItem,
  context: ContextVariables,
  handleComponentLoading: (id: string, isLoading: boolean) => void
) => {
  const style = parseStyle(replaceVariables(item.styleOverride || "", context));

  const renderChildLayout = (childLayout: { content: IContentItem[] }) => {
    return childLayout.content.map((childItem, index) => (
      <React.Fragment key={index}>
        {renderContent(childItem, context, handleComponentLoading)}
      </React.Fragment>
    ));
  };

  const calculateFlexValues = (content: IContentItem[]) => {
    if (content.length === 1) {
      return ["1"];
    }
    return content.map((item) => item.size?.toString() || "1");
  };

  switch (item.type) {
    case "grid":
      const flexStyle = {
        ...style,
        display: "flex",
        height: "100%",
      };
      const flexValues = calculateFlexValues(item.content as IContentItem[]);
      return (
        <div style={flexStyle}>
          {item.content &&
            Array.isArray(item.content) &&
            item.content.map((subItem, index) => (
              <div
                key={index}
                style={{ flex: flexValues[index], height: "100%" }}
              >
                {renderContent(subItem, context, handleComponentLoading)}
              </div>
            ))}
        </div>
      );
    case "image":
      return <ImageContent item={item} context={context} />;
    case "iframe":
      const iframeUrl = replaceVariables(item.iframeUrl || "", context);
      const iframeStyle = parseStyle(
        replaceVariables(item.iframeStyle || "", context)
      );
      return (
        <div style={style}>
          <iframe
            src={encodeURI(iframeUrl)}
            title={item.title || "Presentation iframe"}
            style={iframeStyle}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      );
    case "grid":
      return (
        <div style={style}>
          {item.content &&
            Array.isArray(item.content) &&
            item.content.map((subItem, index) => (
              <React.Fragment key={index}>
                {renderContent(subItem, context, handleComponentLoading)}
              </React.Fragment>
            ))}
        </div>
      );
    case "lwccomponent":
      if (item.componentName) {
        const Component = componentRegistry[item.componentName];
        const childProps = item.childProps
          ? JSON.parse(
              replaceVariables(JSON.stringify(item.childProps), context)
            )
          : {};
        return (
          <div style={style}>
            <Suspense
              fallback={
                <Loader
                  contextVariables={{
                    LOADER_LOGO:
                      "https://patter-demos-mu.vercel.app/Patter_Logo.png",
                    COMPANY_NAME: "Patter AI",
                  }}
                />
              }
            >
              {Component ? (
                <Component
                  {...childProps}
                  onLoadingChange={(isLoading: boolean) =>
                    handleComponentLoading(
                      item.id || item.componentName || "",
                      isLoading
                    )
                  }
                />
              ) : (
                // <div>Loading component: {item.componentName}</div>
                <Loader
                  contextVariables={{
                    LOADER_LOGO:
                      "https://patter-demos-mu.vercel.app/Patter_Logo.png",
                    COMPANY_NAME: "Patter AI",
                  }}
                />
              )}
            </Suspense>
            {item.childLayout && renderChildLayout(item.childLayout)}
          </div>
        );
      }
      return <div style={style}>Component not specified</div>;
    default:
      return (
        <div style={style}>
          {/* {typeof item.content === 'string' ? item.content : null} */
          /* TODO: figure out a way to use this properly */}

          {item.childLayout && renderChildLayout(item.childLayout)}
        </div>
      );
  }
};

export const PresentationRenderer: React.FC<{
  data: IPresentationSlides;
  context: ContextVariables;
  components?: Record<string, React.ComponentType<any>>;
  dataHooks?: DataHooks;
  currentSlideIndex: number;
  onLoadingChange: (isLoading: boolean) => void;
}> = ({
  data,
  context,
  components,
  dataHooks,
  currentSlideIndex,
  onLoadingChange,
}) => {
  const [extendedContext, setExtendedContext] = useState(context);
  const [loadingComponents, setLoadingComponents] = useState<Set<string>>(
    new Set()
  );
  const isInitialMount = useRef(true);

  const handleComponentLoading = useCallback(
    (id: string, isLoading: boolean) => {
      setLoadingComponents((prev) => {
        if (isLoading && !prev.has(id)) {
          return new Set(prev).add(id);
        } else if (!isLoading && prev.has(id)) {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        }
        return prev;
      });
    },
    []
  );

  useEffect(() => {
    const isLoading = loadingComponents.size > 0;
    onLoadingChange(isLoading);
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [loadingComponents, onLoadingChange]);

  useEffect(() => {
    const loadData = async () => {
      if (dataHooks) {
        const newData = await Promise.all(
          Object.entries(dataHooks).map(async ([key, hook]) => {
            const result = await hook(context);
            return { [key]: result };
          })
        );
        setExtendedContext((prev) => ({
          ...prev,
          ...Object.assign({}, ...newData),
        }));
      }
    };

    loadData();
  }, [context, dataHooks]);

  useEffect(() => {
    if (components) {
      Object.entries(components).forEach(([name, component]) => {
        registerComponent(name, component);
      });
    }

  

    return () => {
    };
  }, [components]);

  if (!data || !data.slides || data.slides.length === 0) {
    throw new Error("No slide data available");
  }

  const currentSlide = data.slides[currentSlideIndex];
  if (!currentSlide && data.slides.length > 0) {
    throw new Error(`Slide not found for index ${currentSlideIndex}`);
  }

  const { layout } = currentSlide;
  const style = {
    ...parseStyle(
      replaceVariables(layout.styleOverride || "", extendedContext)
    ),
    height: "100vh",
    overflow: "hidden",
  };

  return (
    <div style={style}>
      {renderContent(layout, extendedContext, handleComponentLoading)}
    </div>
  );
};
