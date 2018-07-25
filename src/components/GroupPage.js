import React, { Component } from 'react'

import SusuContract from '../../build/contracts/Susu.json'
import getWeb3 from '../utils/getWeb3'
import {BigNumber} from 'bignumber.js';

import '../css/oswald.css'
import '../css/open-sans.css'
import '../css/pure-min.css'
import '../App.css'
import PartnerRow from "./PartnerRow";
import GroupInfo from "./GroupInfo";
import ActionButtons from "./ActionButtons";
import PartnerRowEmpty from "./PartnerRowEmpty";

class GroupPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      susuContract: null,
      myAddress: '',
      contribAmt: 0,
      groupName: '---',
      payoutFrequency: 'monthly',
      manyMembers: 0,
      groupSize: 0,
      member0Address: '',
      member1Address: '',
      member2Address: '',
      member3Address: '',
      member0Contrib: 0.0,
      member1Contrib: 0.0,
      member2Contrib: 0.0,
      member3Contrib: 0.0,
      amIOwner: false,
      partnerObjects: [],
      contractAddress: props.match.params.contractAddress
    }
  }

  componentWillMount() {
    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        });

        // Instantiate contract once web3 provided.
        this.instantiateContract();
      })
      .catch((err) => {
        console.log('Error finding web3. err:',err);
      })
  }

  instantiateContract() {
    // const contract = require('truffle-contract');

    let _this = this;
    this.state.web3.eth.getAccounts(function(error, accounts) {
      _this.setState({myAddress: accounts[0]});
    });

    const susuContract = this.state.web3.eth.contract(SusuContract.abi).at(this.state.contractAddress);
    this.setState({susuContract:susuContract});

    // init partner objects array
    for(let i=0; i<this.state.groupSize; i++) {
      let partnerObjects = this.state.partnerObjects;
      partnerObjects.push({});
      this.setState({ partnerObjects: partnerObjects });
    }

    susuContract.groupName((err, groupName)=>{
      this.setState({groupName:groupName});
    });

    susuContract.contribAmtWei((err, contribAmtWei)=>{
      let bigNumber = new BigNumber(contribAmtWei);
      const contribAmt = this.state.web3.fromWei(bigNumber, 'ether').toNumber();
      this.setState({contribAmt:contribAmt});
    });

    susuContract.amIOwner((err, amIOwner)=>{
      this.setState({amIOwner:amIOwner});
      susuContract.getManyMembers((err, manyMembersBig)=>{
        let bigNumber = new BigNumber(manyMembersBig);
        const manyMembers = bigNumber.toNumber();
        this.setState({manyMembers:manyMembers});

        susuContract.groupSize((err, groupSizeBig)=>{
          let bigNumber = new BigNumber(groupSizeBig);
          const groupSize = bigNumber.toNumber();
          this.setState({groupSize:groupSize});

          for(var i=0; i<this.state.manyMembers; i++) {
            let newPartnerObj = {};
            let partnerObjects = this.state.partnerObjects;
            partnerObjects.push(newPartnerObj);
            this.setState({partnerObjects:partnerObjects});
            this.state.susuContract.getMemberAtIndex(i, this.setMemberAddressCallback(i));
            this.state.susuContract.getContributionForMember(i, this.setMemberContribCallback(i));
          }
        });
      });
    });
  }

  render() {
    let isOwner = this.state.amIOwner;
    let isGroupFull = this.isGroupFull();
    let isGroupTerminated = false;
    let isMember = this.isMember();

    return (
      <main className="container">
        <div className="pure-g">
          <div className="pure-u-1-1" style={{paddingTop:'15px'}}>
            <GroupInfo groupName={this.state.groupName} contribAmt={this.state.contribAmt}/>
            <table className="memberTable">
              <tbody>
              {this.createPartnerRows()}
              {this.createEmptyPartnerRows()}
              </tbody>
            </table>
          </div>

          <ActionButtons isOwner={isOwner} isGroupFull={isGroupFull} isGroupTerminated={isGroupTerminated} isMember={isMember}/>

        </div>
      </main>
    );
  }// render()

  setMemberAddressCallback(partnerIndex){
    return (err, partnerAddress)=>{
      let partnerObjects = this.state.partnerObjects;
      partnerObjects[partnerIndex].address = partnerAddress;
      this.setState({partnerObjects:partnerObjects});
    }
  }

  setMemberContribCallback(partnerIndex){
    return (err, partnerContribWei)=>{
      let bigNumber = new BigNumber(partnerContribWei);
      const contribAmt = this.state.web3.fromWei(bigNumber, 'ether').toNumber();
      let partnerObjects = this.state.partnerObjects;
      partnerObjects[partnerIndex].contrib = contribAmt;
      this.setState({partnerObjects:partnerObjects});
    }
  }

  createPartnerRows() {
    let rows = [];

    let keyId = 1;
    for(let partnerObj of this.state.partnerObjects) {
      rows.push(
        <PartnerRow
          key={keyId++} // Required for ES6/React(?) array items
          myAddress={this.state.myAddress}
          partnerAddress={partnerObj.address}
          isOwner={this.state.amIOwner}
          partnerContrib={partnerObj.contrib}
          contractContrib={this.state.contribAmt}
        />
      );
    }
    return rows;
  }
  createEmptyPartnerRows() {
    let rows = [];

    for(var i=0; i<(this.state.groupSize - this.state.manyMembers); i++) {
      rows.push(
        <PartnerRowEmpty
          key={i} // Required for ES6/React(?) array items
        />
      );
    }
    return rows;
  }

  isGroupFull() {
    let isGroupFull = true;
    for(let partnerObj of this.state.partnerObjects) {
      if(typeof partnerObj.address ===  'undefined') {
        isGroupFull = false;
        break;
      }
    }
    return this.state.groupSize>0 && isGroupFull;
  }

  isMember() {
    for(let partnerObj of this.state.partnerObjects) {
      if(partnerObj.address ===  this.state.myAddress) {
        return true;
      }
    }
    return false;
  }
}

GroupPage.defaultProps = {
};

export default GroupPage
