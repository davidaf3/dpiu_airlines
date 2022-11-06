import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/antd.css";
import { ConfigProvider } from "antd";
import esES from "antd/es/locale/es_ES";
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ConfigProvider locale={esES}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
