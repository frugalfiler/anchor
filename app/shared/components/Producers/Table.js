// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import { I18n } from 'react-i18next';
import { debounce, isEqual } from 'lodash';
import { Grid, Header, Input, Segment, Table } from 'semantic-ui-react';

import ProducersVoteWeight from './Vote/Weight';
import ProducersTableRow from './Table/Row';

export default class ProducersTable extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      column: 'votes',
      data: props.producers.list.slice(0, 1),
      direction: 'descending',
      filter: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.state.data, nextProps.producers.list)) {
      this.setState({
        data: _.sortBy(nextProps.producers.list, 'votes').reverse()
      });
    }
  }

  onSearchChange = debounce((e, { value }) => {
    this.setState({ filter: value });
  }, 300);

  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state;

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: 'ascending',
      });
      return;
    }

    this.setState({
      data: data.reverse(),
      direction: direction === 'ascending' ? 'descending' : 'ascending',
    });
  }

  render() {
    const {
      globals,
      selected,
      validUser
    } = this.props;
    const {
      column,
      data,
      direction,
      filter
    } = this.state;
    const {
      current
    } = globals;
    const activatedStake = (current.total_activated_stake)
      ? parseInt(current.total_activated_stake / 10000, 10)
      : 0;
    const activatedStakePercent = parseFloat((activatedStake / 1000000000) * 100, 10).toFixed(2);
    const totalVoteWeight = (current.total_producer_vote_weight)
      ? current.total_producer_vote_weight
      : 0;
    return (
      <I18n ns="producers">
        {
          (t) => (
            <Segment basic loading={(data.length <= 1)}>
              <Grid>
                <Grid.Column width="10">
                  <Header>
                    {activatedStake.toLocaleString()} {t('block_producer_eos_staked')} ({activatedStakePercent}%)
                    <Header.Subheader>
                      <ProducersVoteWeight
                        weight={totalVoteWeight}
                      />
                      {' '}
                      {t('block_producer_total_weight')}
                    </Header.Subheader>
                  </Header>
                </Grid.Column>
                <Grid.Column width="6" textAlign="right">
                  <Input
                    icon="search"
                    onChange={this.onSearchChange}
                    placeholder="Search..."
                  />
                </Grid.Column>
              </Grid>
              <Table
                color="violet"
                size="small"
                // sortable
                style={{ borderRadius: 0 }}
              >
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell collapsing />
                    <Table.HeaderCell
                      // onClick={this.handleSort('owner')}
                      sorted={column === 'owner' ? direction : null}
                    >
                      {t('block_producer')}
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      // onClick={this.handleSort('votes')}
                      sorted={column === 'votes' ? direction : null}
                    >
                      {t('block_producer_total_votes')}
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      collapsing
                      // onClick={this.handleSort('last_produced_block_time')}
                      sorted={column === 'last_produced_block_time' ? direction : null}
                    >
                      {t('block_producer_last_production_status')}
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.filter(producer => (filter ? producer.owner.includes(filter) : true))
                    // .sort((a, b) => parseInt(b.total_votes, 10) - parseInt(a.total_votes, 10))
                    .map((producer, idx) => {
                      const isSelected = (selected.indexOf(producer.owner) !== -1);
                      return (
                        <ProducersTableRow
                          addProducer={this.props.addProducer}
                          filter={filter}
                          isSelected={isSelected}
                          key={producer.key}
                          position={idx + 1}
                          producer={producer}
                          removeProducer={this.props.removeProducer}
                          totalVoteWeight={totalVoteWeight}
                          validUser={validUser}
                        />
                      )
                    })
                  }
                </Table.Body>
              </Table>
            </Segment>
          )
        }
      </I18n>
    );
  }
}
