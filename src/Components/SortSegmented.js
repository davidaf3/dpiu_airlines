import { Segmented } from "antd";
import { FieldTimeOutlined, EuroOutlined } from "@ant-design/icons";
import { useState } from "react";

const orders = new Map([
  ["1", { col: "base_price", asc: true }],
  ["2", { col: "duration", asc: true }],
]);

export default function SortSegmented({ onSelect }) {
  const [selected, setSelected] = useState("1");

  return (
    <Segmented
      options={[
        {
          value: "1",
          label: "Más baratos primero",
          icon: <EuroOutlined />,
        },
        {
          value: "2",
          label: "Más cortos primero",
          icon: <FieldTimeOutlined />,
        },
      ]}
      value={selected}
      onChange={(value) => {
        setSelected(value);
        onSelect(orders.get(value));
      }}
    />
  );
}
