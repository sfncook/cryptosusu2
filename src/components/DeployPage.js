import React, { Component } from 'react'
import contract from 'truffle-contract'

import getWeb3 from '../utils/getWeb3'

import '../App.css'
import SusuParentContract from "../../build/contracts/SusuParent";
import SusuOrigContract from "../../build/contracts/SusuOrig";
import SusuContract from "../../build/contracts/Susu";
import {BigNumber} from "bignumber.js";

class DeployPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      isLoading: false,
      susuParentContract: null,
      susuContract: null,
      key:'key',
      contribAmtWei:0,
    }
  }

  componentWillMount() {
    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        });

        this.instantiateSusuContract();
      })
      .catch(() => {
        console.log('Error finding web3.');
      })
  }

  instantiateSusuContract() {
    const contract = require("truffle-contract");
    const susuParentContract = contract(SusuParentContract);
    const provider = new this.state.web3.providers.HttpProvider("http://127.0.0.1:7545");
    susuParentContract.setProvider(provider);
    this.setState({susuParentContract: susuParentContract});

    console.log('accounts:',this.state.web3.eth.accounts);
  }

  render() {
    const disabled = this.state.isLoading ? 'btn-disabled' : '';
    const btnClasses = `${disabled} btn-contribute`;
    return (
      <main className="container">
        <div className="pure-g">
          <div className="pure-u-1-1" style={{paddingTop:'15px'}}>
            <button onClick={(e)=>{this.createSusu(e)}} className="btn-join" type="button">createSusu</button>
            <button onClick={(e)=>{this.setSusu(e)}} className="btn-join" type="button">setSusu</button>
            <button onClick={(e)=>{this.upgradeSusu(e)}} className="btn-join" type="button">upgradeSusu</button>
            <button onClick={(e)=>{this.version(e)}} className="btn-join" type="button">version</button>
            <button onClick={(e)=>{this.groupName(e)}} className="btn-join" type="button">groupName</button>
            <button onClick={(e)=>{this.getManyMembers(e)}} className="btn-join" type="button">getManyMembers</button>
            <button onClick={(e)=>{this.getMemberAtIndex0(e)}} className="btn-join" type="button">getMemberAtIndex0</button>
            <button onClick={(e)=>{this.getMemberAtIndex1(e)}} className="btn-join" type="button">getMemberAtIndex1</button>
            <button onClick={(e)=>{this.owner(e)}} className="btn-join" type="button">owner</button>
            <button onClick={(e)=>{this.amIOwner(e)}} className="btn-join" type="button">amIOwner</button>
            <button onClick={(e)=>{this.joinGroup(e)}} className="btn-join" type="button">joinGroup</button>
            <button onClick={(e)=>{this.contribute(e)}} className="btn-join" type="button">contribute</button>
            <button onClick={(e)=>{this.contribAmtWei(e)}} className="btn-join" type="button">set contribAmtWei</button>
            <button onClick={(e)=>{this.getContributionForMember(e)}} className="btn-join" type="button">getContributionForMember</button>
            <table className="groupTable">
              <tbody>
              <tr id="memberTemplate">
                <th>Group Name:</th>
                <td><input id={'group_name'}/></td>
              </tr>
              <tr id="memberTemplate">
                <th>Many Partners:</th>
                <td><input id={'group_size'}/></td>
              </tr>
              <tr id="memberTemplate">
                <th>Contribution Amt (eth):</th>
                <td><input id={'contrib_amt'}/></td>
              </tr>
              </tbody>
            </table>

            <div className="pure-u-1-1">
              <button onClick={(e)=>{this.clickCreate(e)}} className={btnClasses} type="button" data-id="0" hidden={this.state.isLoading}>Create New Susu Group</button>
            </div>
            <h1 hidden={!this.state.isLoading} className={"please-wait"}>Deploying Contract.  Please wait</h1>
          </div>
        </div>
      </main>
    );
  }// render()


  createSusu(e) {
    e.preventDefault();
    this.state.susuParentContract.deployed().then((instance)=>{
      const options = { from: this.state.web3.eth.accounts[0], gas: 2000000 };
      return instance.createSusu(this.state.key, 2, 'name_'+this.state.key, this.state.web3.toWei(1.0, "ether"), options);
    }).then((result)=>{console.log('createSusu result:',result);});
  }

  setSusu(e) {
    e.preventDefault();
    this.state.susuParentContract.deployed().then((instance)=>{
      return instance.getSusu.call(this.state.key);
    }).then((susuContractAddress)=>{
      console.log('susuContractAddress:',susuContractAddress);
      const susuContract = this.state.web3.eth.contract(SusuContract.abi).at(susuContractAddress);
      this.setState({susuContract: susuContract});
    });
  }

  upgradeSusu(e) {
    e.preventDefault();
    this.state.susuParentContract.deployed().then((instance)=>{
      const options = { from: this.state.web3.eth.accounts[0], gas: 2000000 };
      return instance.upgradeSusu(this.state.key, options);
    }).then((result)=>{console.log('upgradeSusu result:',result);});
  }

  version(e) {
    e.preventDefault();
    this.state.susuContract.version((err, version)=>{
      console.log('err:',err, ' version:', version);
    });
  }

  groupName(e) {
    e.preventDefault();
    this.state.susuContract.groupName((err, groupName)=>{
      console.log('err:',err, ' groupName:', groupName);
    });
  }

  getManyMembers(e) {
    e.preventDefault();
    this.state.susuContract.getManyMembers((err, getManyMembersBig)=>{
      let bigNumber = new BigNumber(getManyMembersBig);
      const getManyMembers = bigNumber.toNumber();
      console.log('err:',err, ' getManyMembers:', getManyMembers);
    });
  }

  contribute(e) {
    e.preventDefault();

    this.state.web3.eth.sendTransaction(
      {
        from: this.state.web3.eth.accounts[0],
        to: this.state.susuContract.address,
        value:this.state.contribAmtWei,
        gas:2000000
      },
      (err)=>{
        if(typeof err === 'undefined' || !err) {
          console.log('contribute done');
        } else {
          console.error(err);
        }
      });
  }

  contribAmtWei(e) {
    e.preventDefault();
    this.state.susuContract.contribAmtWei((err, contribAmtWeiBig)=>{
      let bigNumber = new BigNumber(contribAmtWeiBig);
      const contribAmtWei = bigNumber.toNumber();
      console.log('err:',err, ' contribAmtWei:', contribAmtWei);
      this.setState({contribAmtWei: contribAmtWei});
    });
  }

  getContributionForMember(e) {
    e.preventDefault();
    this.state.susuContract.getContributionForMember(this.state.web3.eth.accounts[0], (err, getContributionForMemberBig)=>{
      let bigNumber = new BigNumber(getContributionForMemberBig);
      const getContributionForMember = this.state.web3.fromWei(bigNumber, 'ether').toNumber();
      console.log('err:',err, ' getContributionForMember:', getContributionForMember);
    });
  }

  getMemberAtIndex0(e) {
    e.preventDefault();
    this.state.susuContract.getMemberAtIndex(0, (err, memberAddress)=>{
      console.log('err:',err, ' memberAddress0:', memberAddress);
    });
  }

  getMemberAtIndex1(e) {
    e.preventDefault();
    this.state.susuContract.getMemberAtIndex(1, (err, memberAddress)=>{
      console.log('err:',err, ' memberAddress1:', memberAddress);
    });
  }

  owner(e) {
    e.preventDefault();
    const options = {from: this.state.web3.eth.accounts[0]};
    this.state.susuContract.owner(options, (err, owner)=>{
      console.log('err:',err, ' owner:', owner, ' =?me', (owner===this.state.web3.eth.accounts[0]));
    });
  }

  amIOwner(e) {
    e.preventDefault();
    const options = {from: this.state.web3.eth.accounts[0]};
    this.state.susuContract.amIOwner(options, (err, amIOwner)=>{
      console.log('err:',err, ' amIOwner:', amIOwner);
    });
  }

  joinGroup(e) {
    e.preventDefault();
    const options = {from: this.state.web3.eth.accounts[0], gas: 2000000};
    this.state.susuContract.joinGroup(options, (err, resp)=>{console.log('err:',err, ' resp:', resp);});
  }

  clickCreate(e) {
    e.preventDefault();
    this.setState({isLoading:true});
    const susuContract = contract(SusuOrigContract);
    const { unlinked_binary, abi } = susuContract;
    const newContract = this.state.web3.eth.contract(abi);
    const options = { from: this.state.web3.eth.accounts[0], data: unlinked_binary, gas: 2000000 };

    const groupSize = document.getElementById('group_size').value;
    const groupName = document.getElementById('group_name').value;
    const contribAmtEth = document.getElementById('contrib_amt').value;
    const contribAmtWei = this.state.web3.toWei(contribAmtEth, 'ether');
    newContract.new(groupSize, groupName, contribAmtWei, options, this.newContractCallback());
  }

  newContractCallback() {
    return (err, newContract) => {
      const { address } = newContract;
      if(typeof address !== 'undefined' ) {
        window.location.href = '/'+address;
      }
    }
  }
}

DeployPage.defaultProps = {
};

export default DeployPage
