import React from 'react';
import withRouter from './withRouter';
import { Dropdown, Menu, Space, Card, Row, Col, Button, Typography, Divider } from 'antd';
import { DownOutlined } from '@ant-design/icons';
const { Text, Title } = Typography;

class GetCheapestFlights extends React.Component {

  constructor(props) {
    super(props);
    const favouriteAirport = this.props.user?.airport;
    this.state = {
      flights: [],
      chosen: favouriteAirport,
      name: favouriteAirport ? 
        this.getNameCity(favouriteAirport) : 
        "Todos los aeropuertos",
    }
  }

  componentDidMount() {
    this.getCheapestFlights(this.props.user?.airport);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user?.airport !== this.props.user?.airport) {
      this.chooseFavouriteAirport();
    }
  }

  chooseFavouriteAirport() {
    if (this.props.user?.airport) {
      this.updateChosen(this.props.user.airport);
    }
  }

  async getCheapestFlights(code) {
    if (!code) {
      const { data, error } = await this.props.supabase
        .from('getcheapestflight')
        .select('*')

      if (error == null) {
        this.setState({
          flights: data
        });
      }
    } else {
      const { data, error } = await this.props.supabase
        .from('getcheapestflight')
        .select('*').eq('origin', code)

      if (error == null) {
        this.setState({
          flights: data
        });
      }
    }
  }

  getNameCity(code) {
    if (this.props.airports.has(code)) {
      return this.props.airports.get(code).city;
    }
    return code;
  }

  clickFlight(flight) {
    this.props.navigate(`/flights/buy_ticket?departure=${flight.code}&passengers=1`);
  }

  generateColumns() {
    let array = []
    let arrayRow = []
    let stringToUse = ""
    for (let i = 0; i < this.state.flights.length; i++) {
      if (this.state.chosen === undefined) {
        stringToUse = "Vuelo desde " + this.getNameCity(this.state.flights[i].origin) + " a " + this.getNameCity(this.state.flights[i].destination)
      } else {
        stringToUse = "Vuelo a " + this.getNameCity(this.state.flights[i].destination)
      }
      arrayRow.push(<Col>
        <Card title={stringToUse} hoverable style={{ width: 350, }} cover={<img alt="example" src={"https://gfhyobdofzshidbbnaxf.supabase.co/storage/v1/object/public/cities/" + this.state.flights[i].destination + ".png"} />}>
          <Row type="flex" justify="center"><Button type="primary" onClick={() => this.clickFlight(this.state.flights[i])} >{"Billetes desde " + this.state.flights[i].base_price + " €"}</Button></Row>
        </Card>
      </Col>)
      arrayRow.push()
      if (arrayRow.length === 3) {
        array = array.concat(<Row type="flex" justify="center"><Space size="middle">{arrayRow}</Space></Row>)
        arrayRow = [];
      }
    }
    array = array.concat(<Row type="flex" justify="center"><Space size="middle">{arrayRow}</Space></Row>)
    return array;
  }

  updateChosen(code) {
    if (this.props.airports.has(code)) {
      const airport = this.props.airports.get(code);
      this.setState({
        chosen: airport.code,
        name: airport.city
      });
      this.getCheapestFlights(code);
    } else {
      this.setState({
        chosen: undefined,
        name: "Todos los aeropuertos"
      });
      this.getCheapestFlights(undefined);
    }
  }

  generateDropDown() {
    const items = [];
    this.props.airports.forEach((airport, code) => {
      items.push({
        key: code,
        label: (<Text>{airport.city}</Text>)
      });
    });
    items.push({ key: "any", label: <Text>Todos los aeropuertos</Text> });
    const menu = (
      <Menu onClick={(event) => this.updateChosen(event.key)} items={items}
      />
    );
    return <Title level={3}>
      <Dropdown overlay={menu}><a onClick={(e) => e.preventDefault()}>
        <Space> {this.state.name}<DownOutlined /></Space>
      </a>
      </Dropdown>
    </Title>

  }


  render() {
    let array = []
    array.push(<Divider><Row span={5}><Title level={3}>Destinos más baratos volando desde {this.generateDropDown()}</Title></Row></Divider>)
    array.push(<Row justify="center" gutter={2}>{<Space direction="vertical" size="middle">{this.generateColumns()}</Space>}</Row>)
    return array
  }
}

export default withRouter(GetCheapestFlights);


