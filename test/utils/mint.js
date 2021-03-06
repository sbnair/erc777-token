/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const chai = require('chai');
chai.use(require('chai-as-promised')).should();
const utils = require('./index');

exports.test = function(web3, accounts, token) {
  describe('minting', function() {
    it(`should mint 10 ${token.symbol} for account 1`,
      async function() {
        await utils.assertBalance(web3, token, accounts[1], 0);

        let eventsCalled = utils.assertEventsWillBeCalled(
          token.contract, [{
            name: 'Minted',
            data: {
              operator: web3.utils.toChecksumAddress(accounts[0]),
              to: web3.utils.toChecksumAddress(accounts[1]),
              amount: web3.utils.toWei('10'),
              operatorData: null,
            },
          }, {
            name: 'Transfer',
            data: {
              from: utils.zeroAddress,
              to: web3.utils.toChecksumAddress(accounts[1]),
              amount: web3.utils.toWei('10'),
            },
          }]
        );

        await token.contract.methods
          .mint(accounts[1], web3.utils.toWei('10'), '0x')
          .send({ gas: 300000, from: accounts[0] });

        await utils.assertBalance(web3, token, accounts[1], 10);
        await eventsCalled;
      }
    );

    it(`should mint 10 ${token.symbol} for ` + `${accounts[1]} ` + '(ERC20 Disabled)',
      async function() {
        await utils.assertBalance(web3, token, accounts[1], 0);
        
        let eventCalled = utils.assertEventWillBeCalled(
          token.contract, 'Minted', {
            operator: web3.utils.toChecksumAddress(accounts[0]),
            to: web3.utils.toChecksumAddress(accounts[1]),
            amount: web3.utils.toWei('10'),
            operatorData: null,
          }
        );
  
        await token.contract.methods
          .disableERC20()
          .send({ gas: 300000, from: accounts[0] });
  
        await token.contract.methods
          .mint(accounts[1], web3.utils.toWei('10'), '0x')
          .send({ gas: 300000, from: accounts[0] });

        await utils.assertBalance(web3, token, accounts[1], 10);
        await eventCalled;

        await token.contract.methods
          .enableERC20()
          .send({ gas: 300000, from: accounts[0] });
      }
    );

    // deactivated due to compile errors in the pwasm contract when
    // a U256 multiply operation is performed.
    it(`should not mint -10 ${token.symbol} (negative amount)`,
      async function() {
        await utils.assertBalance(web3, token, accounts[1], 0);

        await token.contract.methods
          .mint(accounts[1], web3.utils.toWei('-10'), '0x')
          .send({ gas: 300000, from: accounts[0] })
          .should.be.rejectedWith('revert');

        await utils.assertBalance(web3, token, accounts[1], 0);
      }
    );

    // deactivated due to compile errors in the pwasm contract when
    // a U256 multiply operation is performed.
    it(`should not mint 0.007 ${token.symbol} (< granulairty)`,
      async function() {
        await utils.assertBalance(web3, token, accounts[1], 0);

        await token.contract.methods
          .mint(accounts[1], web3.utils.toWei('0.007'), '0x')
          .send({ gas: 300000, from: accounts[0] })
          .should.be.rejectedWith('revert');

        await utils.assertBalance(web3, token, accounts[1], 0);
      }
    );
  });
};
