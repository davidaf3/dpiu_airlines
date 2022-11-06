import {
  Form,
  Row,
  Button,
  InputNumber,
  DatePicker,
  Col,
  Radio,
  Typography,
  Card,
} from "antd";
import { SearchOutlined, SwapOutlined } from "@ant-design/icons";
import AirportSelect from "./AirportSelect";
import { useEffect, useRef, useState } from "react";
import moment from "moment";

export default function SearchFlightInput({
  airports,
  values,
  onSearch,
  user,
}) {
  const [origin, setOrigin] = useState(values?.origin);
  const [destination, setDestination] = useState(values?.destination);
  const [roundTrip, setRoundTrip] = useState(values?.roundTrip ?? true);

  const formRef = useRef(null);
  const prevRoundTrip = useRef(roundTrip);

  useEffect(() => {
    if (roundTrip === prevRoundTrip.current) return;
    prevRoundTrip.current = roundTrip;

    let [departureDate, returnDate] = formRef.current.getFieldValue(
      "dates"
    ) ?? [undefined, undefined];

    if (roundTrip) {
      departureDate = formRef.current.getFieldValue("date");
      returnDate =
        departureDate && departureDate.isSameOrBefore(returnDate)
          ? returnDate
          : undefined;
      formRef.current.setFieldValue("dates", [departureDate, returnDate]);
    } else {
      formRef.current.setFieldValue("date", departureDate);
    }
  }, [roundTrip]);

  useEffect(() => {
    if (user && !formRef.current.getFieldValue("origin")) {
      formRef.current.setFieldValue("origin", user.airport);
      setOrigin(user.airport);
    }
  }, [user]);

  useEffect(() => {
    formRef.current.setFieldValue("origin", origin);
  }, [origin]);

  useEffect(() => {
    formRef.current.setFieldValue("destination", destination);
  }, [destination]);

  const swapOriginDestination = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const disabledDate = (current) => current < moment().subtract(1, "day");

  return (
    <div>
      <Typography.Title level={2}>
        Encuentra el mejor vuelo para tu próximo viaje
      </Typography.Title>
      <Card style={{ marginBottom: "1.5em" }} bordered>
        <Form
          ref={formRef}
          onFinish={onSearch}
          name="searchFlight"
          layout="vertical"
          initialValues={values ?? { passengers: 1, roundTrip }}
        >
          <Row align="bottom">
            <Form.Item name="roundTrip">
              <Radio.Group onChange={(e) => setRoundTrip(e.target.value)}>
                <Radio value={true}>Ida y vuelta</Radio>
                <Radio value={false}>Solo ida</Radio>
              </Radio.Group>
            </Form.Item>
          </Row>
          <Row align="bottom">
            <Col span={5}>
              <Form.Item
                name="origin"
                label="Origen"
                rules={[
                  {
                    required: true,
                    message: "Introduce un aeropuerto de origen",
                  },
                ]}
              >
                <AirportSelect
                  key="origin"
                  airports={airports}
                  excluded={destination}
                  onChange={setOrigin}
                />
              </Form.Item>
            </Col>
            <Col span={1}>
              <Form.Item>
                <Button
                  type="secondary"
                  title="Intercambiar origen y destino"
                  icon={<SwapOutlined />}
                  style={{ width: "100%" }}
                  onClick={swapOriginDestination}
                ></Button>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="destination"
                label="Destino"
                rules={[
                  {
                    required: true,
                    message: "Introduce un aeropuerto de destino",
                  },
                ]}
              >
                <AirportSelect
                  key="destination"
                  airports={airports}
                  excluded={origin}
                  onChange={setDestination}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {roundTrip ? (
                <Form.Item
                  name="dates"
                  label="Fechas"
                  rules={[
                    { required: true, message: "" },
                    {
                      validator: async (_, value) => {
                        if (!value || value.some((date) => date === undefined))
                          throw new Error();
                      },
                      message: "Selecciona las fechas de ida y vuelta",
                    },
                  ]}
                >
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    placeholder={[
                      "Fecha de ida",
                      "Fecha de vuelta",
                    ]}
                    style={{ width: "100%" }}
                    disabledDate={disabledDate}
                  ></DatePicker.RangePicker>
                </Form.Item>
              ) : (
                <Form.Item
                  name="date"
                  label="Fecha"
                  rules={[
                    {
                      required: true,
                      message: "Selecciona la fecha de salida",
                    },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder={"Fecha de salida"}
                    style={{ width: "100%" }}
                    disabledDate={disabledDate}
                  ></DatePicker>
                </Form.Item>
              )}
            </Col>
            <Col span={4}>
              <Form.Item
                name="passengers"
                label="Nº de pasajeros"
                rules={[
                  {
                    required: true,
                    message: "Introduce el número de pasajeros",
                  },
                ]}
              >
                <InputNumber min={1} style={{ width: "100%" }}></InputNumber>
              </Form.Item>
            </Col>
            <Col span={1}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  title="Buscar"
                  icon={<SearchOutlined />}
                  block
                ></Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
