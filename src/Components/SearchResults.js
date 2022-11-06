import { useState, useEffect, useRef, useCallback } from "react";
import FlightCard from "./FlightCard";
import {
  List,
  Row,
  Col,
  Typography,
  Drawer,
  Button,
  Badge,
  ConfigProvider,
  Empty,
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import RoundTripCard from "./RoundTripCard";
import SortDropdown from "./SortDropdown";
import SearchFilters from "./SearchFilters";
import {
  searchSingleFlight,
  searchRoundTrip,
  searchSingleFlightAndMetadata,
  searchRoundTripAndMetadata,
} from "../api";
import "./SearchResults.css";

export default function SearchResults({
  supabase,
  search,
  airports,
  airlines,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  const minMaxHours = useRef({});
  const availabelAirlines = useRef([]);
  const shortest = useRef({});
  const cheapest = useRef([]);

  const filters = useRef(null);
  const applyFilters = (newFilters) => {
    filters.current = newFilters;
    fetchResults(search);
  };

  const order = useRef({ col: "base_price", asc: true });
  const selectOrder = (newOrder) => {
    order.current = newOrder;
    fetchResults(search);
  };

  const filtersForm = useRef(null);

  const fetchResults = useCallback(
    async (search) => {
      setLoading(true);

      const searchFn = search.roundTrip ? searchRoundTrip : searchSingleFlight;
      const newResults = await searchFn(
        supabase,
        search,
        order.current,
        filters.current
      );

      setLoading(false);
      setResults(newResults);
    },
    [supabase]
  );

  const fetchResultsAndMetadata = useCallback(
    async (search) => {
      setLoading(true);

      const searchFn = search.roundTrip
        ? searchRoundTripAndMetadata
        : searchSingleFlightAndMetadata;
      const [
        newResults,
        newAvailableAirlines,
        newMinMaxHours,
        newCheapest,
        newShortest,
      ] = await searchFn(supabase, search, order.current, filters.current);

      setLoading(false);
      setResults(newResults);
      minMaxHours.current = newMinMaxHours;
      availabelAirlines.current = newAvailableAirlines;
      shortest.current = newShortest?.duration;
      cheapest.current = newCheapest?.base_price;
    },
    [supabase]
  );

  const resetFilters = () => {
    if (filtersForm.current)
      filtersForm.current.resetFields(
        minMaxHours.current,
        availabelAirlines.current
      );
  };

  useEffect(() => {
    if (search) {
      filters.current = null;
      fetchResultsAndMetadata(search).then(resetFilters);
    }
  }, [search, fetchResultsAndMetadata]);

  const renderResult = (result) => {
    const key = result.return
      ? result.departure.code + result.return.code
      : result.code;
    const item = result.return ? (
      <List.Item key={result.departure.code + result.return.code}>
        <RoundTripCard
          trip={result}
          airports={airports}
          airlines={airlines}
          passengers={search.passengers}
        ></RoundTripCard>
      </List.Item>
    ) : (
      <List.Item key={result.code}>
        <FlightCard
          flight={result}
          airports={airports}
          airlines={airlines}
          passengers={search.passengers}
          showSelect={true}
        ></FlightCard>
      </List.Item>
    );

    let badge = null;

    if (
      result.duration === shortest.current &&
      result.base_price === cheapest.current
    ) {
      badge = { text: "El mejor", color: "gold" };
    } else if (result.base_price === cheapest.current) {
      badge = { text: "El más barato", color: "orange" };
    } else if (result.duration === shortest.current) {
      badge = { text: "El más corto", color: "cyan" };
    }

    return badge ? (
      <Badge.Ribbon key={key} {...badge}>
        {item}
      </Badge.Ribbon>
    ) : (
      item
    );
  };

  const { Text } = Typography;

  return (
    <div>
      <ConfigProvider
        renderEmpty={() => (
          <Empty
            image={Empty.PRESENTED_IMAGE_DEFAULT}
            description={
              <div>
                <Typography.Paragraph>
                  No se han encontrado resultados para tu búsqueda.
                </Typography.Paragraph>
                <Typography.Paragraph>
                  Revisa el número de pasajeros introducido o prueba con otras
                  fechas.
                </Typography.Paragraph>
              </div>
            }
          />
        )}
      >
        <List
          style={{ backgroundColor: "white" }}
          loading={loading}
          bordered={true}
          dataSource={results}
          pagination={{
            pageSize: 10,
          }}
          header={
            <Row>
              <Col style={{ display: "flex", alignItems: "center" }}>
                <div>
                  <Text strong>{results.length}</Text>{" "}
                  <Text>
                    {results.length === 1 ? "resultado" : "resultados"}
                  </Text>
                </div>
              </Col>
              <Col
                flex={"auto"}
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginRight: "1em",
                }}
              >
                <SortDropdown onSelect={selectOrder}></SortDropdown>
              </Col>
              <Col>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFiltersOpen(true)}
                >
                  Filtrar
                </Button>
              </Col>
            </Row>
          }
          renderItem={renderResult}
        ></List>
      </ConfigProvider>
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        extra={<Button onClick={resetFilters}>Restablecer</Button>}
      >
        {(results.length > 0 || filters.current != null) && (
          <SearchFilters
            ref={filtersForm}
            minMaxHours={minMaxHours.current}
            availableAirlines={availabelAirlines.current}
            allAirlines={airlines}
            setFilters={applyFilters}
          />
        )}
      </Drawer>
    </div>
  );
}
