import React from 'react';
import withRouter from './withRouter';
import { Tooltip, Col, Row, Typography, Descriptions, Button } from 'antd';
import moment from "moment";

class FlightDetails extends React.Component {

    constructor(props) {
        super(props)
        this.code = this.props.params.code;
        this.state = {
            flight : {},
            origin : {},
            destination: {},
            plane: {},
            airline: {},
            tickets: {}
          }
          this.getFlightDetails();

    }

    getFlightDetails = async () => {
        console.log(this.code);
        const { data, error } = await this.props.supabase
          .from('flight')
          .select()
          .eq('code', this.code )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            flight : data[0]
          }, () => {
            this.getAirportOriginDetails();
            this.getAirportDestinationDetails();
            this.getPlaneDetails();
            this.getFlightTickets();
            this.getAirlineDetails();
          }) 
        }
      }

      getAirportOriginDetails = async () => {
        const { data, error } = await this.props.supabase
          .from('airport')
          .select()
          .eq('code', this.state.flight.origin )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            origin : data[0]
          }) 
        }
      }

      getAirportDestinationDetails = async () => {
        const { data, error } = await this.props.supabase
          .from('airport')
          .select()
          .eq('code', this.state.flight.destination )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            destination : data[0]
          }) 
        }
      }

      getPlaneDetails = async () => {
        const { data, error } = await this.props.supabase
          .from('plane')
          .select()
          .eq('id', this.state.flight.plane )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            plane : data[0]
          }) 
        }
      }

      getAirlineDetails = async () => {
        const { data, error } = await this.props.supabase
          .from('airline')
          .select()
          .eq('id', this.state.flight.airline )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            airline : data[0]
          }) 
        }
      }

      getFlightTickets = async () => {
        const { data, error } = await this.props.supabase
          .from('ticket')
          .select()
          .eq('flight_code', this.state.flight.code )
  
        if ( error == null && data.length > 0){
          // Data is a list
          this.setState({
            tickets : data
          }) 
        }
      }


      placeSeat(row, column, numberOfSeat) {
        var price = this.state.flight.base_price;
        if (column == 1 || column == this.state.plane.columns) {
          price += 20;
        }
        if (row == 1) {
          price += 30;
        }
        return <Tooltip placement="top" title={price + " €"}><Col span={2}><Button onClick={() => { this.addTicket(row, column, price) }} style={{ width: "100%" }}>{numberOfSeat}</Button></Col></Tooltip>
      }
    
      createRowSeat = (j, numberOfSeat) => {
        const row = j
        const array = []
        var reserved = 0;
        var half_length = this.state.plane.columns / 2;
        var plane_columns = this.state.plane.columns
        var tickets_already_bought = this.state.tickets
          
        for (var i = 1; i <= plane_columns; i++) {
          for (var z = 0; z < tickets_already_bought.length; z++) {
            if (tickets_already_bought[z].column == i) {
              if (tickets_already_bought[z].row == j) {
                reserved = 1;
              }
            }
          }
    
    
          if (reserved == 0) {
            array.push(this.placeSeat(row, i, numberOfSeat))
          } else if (reserved == 1) {
            array.push(<Tooltip placement="top" title="Ya reservada"><Col span={2}><Button style={{ width: "100%" }} disabled>X</Button></Col></Tooltip>)
          }
    
          if (i == half_length) {
            array.push(<Col span={2}><Button style={{ width: "100%" }}></Button></Col>)
          }
          numberOfSeat += 1;
          reserved = 0;
        }
        return array
      }
    
      createSeats = () => {
        const array = []
        var numberOfSeat = 1
        array.push(<Row style={{ width: "80%", marginBottom: "1em" }}>
          <Col align="middle" span={2}></Col>
          <Col align="middle" span={2}><Typography.Text>A</Typography.Text></Col>
          <Col align="middle" span={2}><Typography.Text>B</Typography.Text></Col>
          <Col align="middle" span={2}><Typography.Text>C</Typography.Text></Col>
          <Col align="middle" span={2}></Col>
          <Col align="middle" span={2}><Typography.Text>D</Typography.Text></Col>
          <Col align="middle" span={2}><Typography.Text>E</Typography.Text></Col>
          <Col align="middle" span={2}><Typography.Text>F</Typography.Text></Col>
        </Row>);
    
    
        for (var i = 1; i <= this.state.plane.rows; i++) {
          array.push(<Row style={{ width: "80%", marginBottom: "1em" }}><Col align="middle" span={2}><Typography.Text>{i}</Typography.Text></Col>{this.createRowSeat(i, numberOfSeat)}</Row>);
          numberOfSeat += this.state.plane.columns
        }
    
        return array
      } 
  

    render() { 
      return (
        <Descriptions title = "Detalles del vuelo" bordered contentStyle={{backgroundColor: "white"}}>
          <Descriptions.Item label ="Código del vuelo" span = {3}>{ this.state.flight.code }</Descriptions.Item>
          <Descriptions.Item label ="Aeropuerto de origen">{ this.state.origin.name }</Descriptions.Item>
          <Descriptions.Item label ="Ciudad">{ this.state.origin.city }</Descriptions.Item>
          <Descriptions.Item label ="Hora de salida">{ moment(this.state.flight.departure).format("DD/MM/YYYY HH:mm") }</Descriptions.Item>
          <Descriptions.Item label ="Aeropuerto de destino">{ this.state.destination.name }</Descriptions.Item>
          <Descriptions.Item label ="Ciudad">{ this.state.destination.city }</Descriptions.Item>
          <Descriptions.Item label ="Hora de llegada">{ moment(this.state.flight.arrival).format("DD/MM/YYYY HH:mm") }</Descriptions.Item>
          <Descriptions.Item label ="Aerolínea" span = {2}>{ this.state.airline.name }</Descriptions.Item>
          <Descriptions.Item label ="Modelo del avión">{ this.state.plane.name }</Descriptions.Item>
          <Descriptions.Item label ="Asientos" span = {3}>{this.createSeats()}</Descriptions.Item>
        </Descriptions>
      )
    }
  }

  export default withRouter(FlightDetails);
