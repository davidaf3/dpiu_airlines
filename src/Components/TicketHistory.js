import { useState, useEffect, useRef } from "react";
import { getTicketHistory, returnTickets } from "../api";
import {
  Button,
  Table,
  Typography,
  Popconfirm,
  message,
  Descriptions,
  Row,
  Col,
  ConfigProvider,
  Empty,
} from "antd";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import "./TicketHistory.css";

const dateFormat = "DD/MM/YY";
const timeFormat = "HH:mm";

function buyDateToStr(buyDate) {
  const now = moment();
  if (now.diff(buyDate, "days") >= 7 )
    return buyDate.format(dateFormat);

  const str = buyDate.fromNow();
  return str[0].toUpperCase() + str.substring(1);
}

function trimName(name) {
  if (name.length <= 25) return name;
  return name.substring(0, 25) + "...";
}

function updateFilter(filterRef, history, getter, mapper) {
  filterRef.current = [];
  const visitedElementds = new Set();
  history.forEach((flight) => {
    const element = getter(flight);
    if (visitedElementds.has(element)) return;

    visitedElementds.add(element);
    filterRef.current.push(mapper(element));
  });
}

export default function TicketHistory({ supabase, airports, airlines, user }) {
  const now = moment();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedRows, setExpandedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const flightFilter = useRef([]);
  const originAirportFilter = useRef([]);
  const destinationAirportFilter = useRef([]);
  const airlinesFilter = useRef([]);

  const onReturnTickets = async (ids) => {
    const error = await returnTickets(supabase, ids);
    if (error) {
      message.error(
        "Se ha producido un error al procesar la devolución. " +
          "Seguirá disponiendo " +
          (ids.length > 1 ? "de los billetes" : "del billete") +
          " en su cuenta."
      );
      return;
    }

    const idsSet = new Set(ids);
    const historyCopy = [...history];
    const flightsToDelete = [];

    historyCopy.forEach((flight, flightIdx) => {
      const ticketsToDelete = [];

      flight.tickets.forEach((ticket, ticketIdx) => {
        if (idsSet.has(ticket.id)) {
          ticketsToDelete.unshift(ticketIdx);
        }
      });

      ticketsToDelete.forEach((ticket) => flight.tickets.splice(ticket, 1));
      if (flight.tickets.length === 0) {
        flightsToDelete.unshift(flightIdx);
      }
    });

    flightsToDelete.forEach((flightIdx) => historyCopy.splice(flightIdx, 1));
    setHistory(historyCopy);

    message.success("La devolución se ha procesado  con éxito.");
  };

  useEffect(() => {
    if (!user) return;
    getTicketHistory(supabase, user.id).then((newHistory) => {
      setHistory(newHistory);
      updateFilter(
        flightFilter,
        newHistory,
        (flight) => flight.code,
        (code) => ({ text: code, value: code })
      );
      if (newHistory.length > 0) setExpandedRows([newHistory[0].key]);
      setLoading(false);
    });
  }, [supabase, user]);

  useEffect(() => {
    const mapper = (airport) => ({
      text: airports.has(airport) ? airports.get(airport).name : airport,
      value: airport,
    });

    updateFilter(
      originAirportFilter,
      history,
      (flight) => flight.origin,
      mapper
    );

    updateFilter(
      destinationAirportFilter,
      history,
      (flight) => flight.destination,
      mapper
    );
  }, [history, airports]);

  useEffect(() => {
    updateFilter(
      airlinesFilter,
      history,
      (flight) => flight.airline,
      (airline) => ({
        text: airlines.has(airline) ? airlines.get(airline).name : airline,
        value: airline,
      })
    );
  }, [history, airlines]);

  const { Title, Link, Text } = Typography;

  const flightColumns = [
    {
      title: "Fecha de compra",
      dataIndex: "buyDate",
      key: "buyDate",
      render: (date) => buyDateToStr(date),
      sorter: (f1, f2) => f1.buyDate.diff(f2.buyDate),
      defaultSortOrder: "descend",
    },
    {
      title: "Pasajeros",
      dataIndex: ["tickets", "length"],
      key: "ticketNumber",
      sorter: (f1, f2) => f1.tickets.length - f2.tickets.length,
      align: "right",
    },
    {
      title: "Vuelo",
      dataIndex: "code",
      key: "code",
      align: "left",
      render: (code) => (
        <Button
          type="link"
          title="Ver detalles del vuelo"
          onClick={() => navigate(`/flights/${code}`)}
        >
          <Link type="link" underline>
            {code}
          </Link>
        </Button>
      ),
      filters: flightFilter.current,
      onFilter: (value, record) => record.code === value,
    },
    {
      title: "Origen",
      dataIndex: "origin",
      key: "origin",
      align: "left",
      render: (origin) =>
        airports.has(origin) ? airports.get(origin).name : origin,
      filters: originAirportFilter.current,
      onFilter: (value, record) => record.origin === value,
    },
    {
      title: "Destino",
      dataIndex: "destination",
      key: "destination",
      align: "left",
      render: (destination) =>
        airports.has(destination)
          ? airports.get(destination).name
          : destination,
      filters: destinationAirportFilter.current,
      onFilter: (value, record) => record.destination === value,
    },

    {
      title: "Fecha",
      dataIndex: "departure",
      key: "date",
      render: (date) => date.format(dateFormat),
      sorter: (f1, f2) => f1.departure.diff(f2.departure),
    },
    {
      title: "Salida",
      dataIndex: "departure",
      key: "departure",
      render: (date) => date.format(timeFormat),
    },
    {
      title: "Llegada",
      dataIndex: "arrival",
      key: "arrival",
      render: (date) => date.format(timeFormat),
    },
    {
      title: "Aerolínea",
      dataIndex: "airline",
      key: "airline",
      align: "left",
      render: (airline) =>
        airlines.has(airline) ? airlines.get(airline).name : airline,
      filters: airlinesFilter.current,
      onFilter: (value, record) => record.airline === value,
    },
    {
      title: "Precio total",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price.toFixed(2).replace(".", ",")} €`,
      sorter: (f1, f2) => f1.price - f2.price,
      align: "right",
    },
    {
      title: "",
      dataIndex: "tickets",
      key: "actions",
      align: "center",
      render: (tickets, record) => (
        <Popconfirm
          placement="topRight"
          title={
            "¿Seguro que desea devolver todos los billetes de esta compra?"
          }
          onConfirm={() => onReturnTickets(tickets.map((ticket) => ticket.id))}
          okText="Sí"
          cancelText="No"
        >
          <Button
            style={
              record.departure.isBefore(now) ? { visibility: "hidden" } : {}
            }
            type="link"
            danger
            onClick={(e) => e.stopPropagation()}
          >
            <Link type="danger" underline>
              Devolver todos
            </Link>
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const ticketRowRender = (flight) => {
    const items = [];
    flight.tickets.forEach((ticket) => {
      items.push(
        <Descriptions.Item label="Pasajero" key={"passenger" + ticket.id}>
          {ticket.firstName} {ticket.lastName}
        </Descriptions.Item>
      );
      items.push(
        <Descriptions.Item label="Asiento" key={"seat" + ticket.id}>
          {ticket.row}
          {ticket.column}
        </Descriptions.Item>
      );
      items.push(
        <Descriptions.Item label="Precio" key={"price" + ticket.id}>
          {ticket.price} €
        </Descriptions.Item>
      );
      items.push(
        <Descriptions.Item key={"actions" + ticket.id}>
          Devolver
        </Descriptions.Item>
      );
    });

    return (
      <div style={{ padding: "1rem" }}>
        <Title level={5}>Pasajeros</Title>
        <Row style={{ width: "100%" }} className="detailContainer">
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row key={"passengerLabel" + ticket.id} className="detailLabel">
                <Text type="secondary">Nombre</Text>
              </Row>
            ))}
          </Col>
          <Col span={6}>
            {flight.tickets.map((ticket) => (
              <Row key={"passenger" + ticket.id} className="detailValue">
                {trimName(ticket.firstName + " " + ticket.lastName)}
              </Row>
            ))}
          </Col>
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row key={"seatLabel" + ticket.id} className="detailLabel">
                <Text type="secondary">Asiento</Text>
              </Row>
            ))}
          </Col>
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row key={"seat" + ticket.id} className="detailValue">
                {ticket.row}
                {String.fromCharCode(ticket.column + 64)}
              </Row>
            ))}
          </Col>
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row key={"priceLabel" + ticket.id} className="detailLabel">
                <Text type="secondary">Precio</Text>
              </Row>
            ))}
          </Col>
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row
                key={"price" + ticket.id}
                className="detailValue detailValueNumber"
              >
                {ticket.price} €
              </Row>
            ))}
          </Col>
          <Col span={3}>
            {flight.tickets.map((ticket) => (
              <Row key={"actions" + ticket.id} className="detailLabel">
                <Popconfirm
                  placement="topRight"
                  title={"¿Seguro que desea devolver este billete?"}
                  onConfirm={() => onReturnTickets([ticket.id])}
                  okText="Sí"
                  cancelText="No"
                >
                  <Button
                    style={
                      flight.departure.isBefore(now)
                        ? { visibility: "hidden" }
                        : {}
                    }
                    type="link"
                    danger
                  >
                    <Link type="danger" underline>
                      Devolver
                    </Link>
                  </Button>
                </Popconfirm>
              </Row>
            ))}
          </Col>
        </Row>
      </div>
    );
  };

  const onExpand = (expanded, record) => {
    if (expanded) setExpandedRows([...expandedRows, record.key]);
    else {
      const idx = expandedRows.indexOf(record.key);
      expandedRows.splice(idx, 1);
    }
  };

  const onPaginationChange = (page) => {
    setCurrentPage(page);
    setExpandedRows([]);
  };

  return (
    <div>
      <Title level={2}>Historial de compras</Title>
      <ConfigProvider
        renderEmpty={() => (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Todavía no has realizado ninguna compra."
          />
        )}
      >
        <Table
          loading={loading}
          columns={flightColumns}
          dataSource={history}
          title={() => (
            <Text>
              <Text strong>{history.length}</Text>{" "}
              {history.length === 1 ? "compra" : "compras"} en el historial
            </Text>
          )}
          expandable={{
            indentSize: 300,
            expandRowByClick: true,
            expandedRowRender: ticketRowRender,
            expandedRowKeys: expandedRows,
            onExpand,
          }}
          pagination={{
            current: currentPage,
            onChange: onPaginationChange,
            pageSize: 5,
          }}
        />
      </ConfigProvider>
    </div>
  );
}
