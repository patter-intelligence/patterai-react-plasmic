import * as React from "react";
import { Slider } from "antd";

import {
  PlasmicCanvasHost,
  registerComponent,
} from "@plasmicapp/react-web/lib/host";
import {  PatterHeaderH1 } from "./patter-ui-components";

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

// registerComponent(...)

// const ProductContext = React.createContext<Product | undefined>(undefined);

// function ProductProvider({ slug, children }: { slug: string; children: ReactNode }) {
//   const data = useFetchProductData(props.slug);
//   return <ProductContext.Provider value={data}>{children}</ProductContext.Provider>;
// }

// function ProductTitle({ className }: { className?: string }) {
//   const product = React.useContext(ProductContext);

//   // Use a default string in case this component is used outside of ProductContext
//   const title = product?.title ?? 'Product Title';
//   return <div className={className}>{title}</div>;
// }

// function ProductPrice({ className }: { className?: string }) {
//   const product = React.useContext(ProductContext);

//   const price = product?.price ?? 100;
//   return <div className={className}>{formatCurrency(price)}</div>;
// }
// A slider with default styles
registerComponent(PatterHeaderH1, {
  name: "PatterHeaderH1",
  importPath: "./patter-ui-components",
  props: {
    title: "string",
  },
  defaultStyles: {
    height: 48,
  },
});

export default function PlasmicHost() {
  return <PlasmicCanvasHost />;
}
