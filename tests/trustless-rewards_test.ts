import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: 'Ensure that owner can create a lobby',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    // console.log(`block `, block);
    block.receipts[0].result.expectOk().expectUint(1);

    const tx = chain.callReadOnlyFn(
      'trustless-rewards',
      'get-lobby',
      [
        types.uint(1), // lobby id
      ],
      deployer.address
    );
    assertEquals(
      tx.result,
      '(ok {active: true, balance: u5, commission: u5, curves: "straight", description: "lobby description", factor: u5, hours: u24, length: "long", mapy: "miamiBeach", owner: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, price: u5, traffic: "intense"})'
    );
  },
});

Clarinet.test({
  name: 'Ensure that owner can create a lobby and disable it, users can not join after disabled',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    // console.log(`block `, block);
    block.receipts[0].result.expectOk().expectUint(1);

    const tx = chain.callReadOnlyFn(
      'trustless-rewards',
      'get-lobby',
      [
        types.uint(1), // lobby id
      ],
      deployer.address
    );
    assertEquals(
      tx.result,
      '(ok {active: true, balance: u5, commission: u5, curves: "straight", description: "lobby description", factor: u5, hours: u24, length: "long", mapy: "miamiBeach", owner: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, price: u5, traffic: "intense"})'
    );

    let block2 = chain.mineBlock([
      Tx.contractCall('trustless-rewards', 'disable-lobby', [types.uint(1)], deployer.address),
    ]);
    // console.log(`block2 `, block2);
    block2.receipts[0].result.expectOk().expectBool(true);

    let block3 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts[0].events);
    block3.receipts[0].result.expectErr().expectUint(403);
  },
});

Clarinet.test({
  name: 'Ensure that anyone can join a lobby, pay entry price, check run details',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    // console.log(`block `, block.receipts[0].events);
    block.receipts[0].result.expectOk().expectUint(1);

    const tx = chain.callReadOnlyFn(
      'trustless-rewards',
      'get-score',
      [
        types.uint(1), // lobby-id
        types.principal(deployer.address),
      ],
      wallet_1.address
    );
    // console.log(`tx `, tx);
    assertEquals(
      tx.result,
      '(ok {nft: "", rac: u0, rank: u0, rank-factor: u0, rewards: u0, score: u0, sum-rank-factor: u0})'
    );
  },
});

Clarinet.test({
  name: 'Ensure that anyone can join a lobby a single time',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts[0].events);
    block2.receipts[0].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');

    let block3 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log(`block3 `, block3.receipts[0].events);
    block3.receipts[0].result.expectErr().expectUint(405);
    // console.log(`block3 `, block3.receipts[0])
    assertEquals(block3.receipts[0].events.length, 0);

    const tx = chain.callReadOnlyFn(
      'trustless-rewards',
      'get-score',
      [
        types.uint(1), // lobby-id
        types.principal(wallet_1.address),
      ],
      wallet_1.address
    );
    // console.log(`tx `, tx);
    assertEquals(
      tx.result,
      '(ok {nft: "", rac: u0, rank: u0, rank-factor: u0, rewards: u0, score: u0, sum-rank-factor: u0})'
    );
  },
});

Clarinet.test({
  name: 'Ensure that owner can publish results for an existing lobby that users have joined',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet_3 = accounts.get('wallet_3')!;
    const walletAddressArray = [wallet_1.address, wallet_2.address, wallet_3.address];

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_2.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_3.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts);
    block2.receipts[0].result.expectErr().expectUint(405);
    block2.receipts[1].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[1].events[0]['stx_transfer_event']['amount'], '5');
    block2.receipts[2].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[2].events[0]['stx_transfer_event']['amount'], '5');

    // (run-result (list 50 { lobby-id: uint, address: principal, score: uint, rank: uint, sum-rank-factor: uint, rank-factor: uint, rewards: uint, rac: uint, nft: (string-ascii 99)}))
    const publishManyRecords: any[] = [];
    let testarray = [...Array(3).keys()].map((x) => x + 1);
    testarray.forEach((id) => {
      let record = {
        'lobby-id': 1,
        address: walletAddressArray[id - 1],
        score: 10,
        rank: id,
        'sum-rank-factor': 9048625,
        'rank-factor': 3048625,
        rewards: 2000000,
        rac: 1800000,
        nft: 'Degen#1',
      };
      publishManyRecords.push(record);
    });
    // console.log('publishManyRecords ', publishManyRecords);
    const args = types.list(
      publishManyRecords.map((record) => {
        return types.tuple({
          'lobby-id': types.uint(record['lobby-id']),
          address: types.principal(record.address),
          score: types.uint(record['score']),
          rank: types.uint(record['rank']),
          'sum-rank-factor': types.uint(record['sum-rank-factor']),
          'rank-factor': types.uint(record['rank-factor']),
          rewards: types.uint(record['rewards']),
          rac: types.uint(record['rac']),
          nft: types.ascii(record['nft']),
        });
      })
    );
    // console.log('args ', args);
    let block = chain.mineBlock([
      Tx.contractCall('trustless-rewards', 'publish-result-many', [args], deployer.address),
    ]);
    // console.log('block ', block, block.receipts[0].events);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

// finish results and distribute rewards
Clarinet.test({
  name: 'Ensure that owner can finish results and distribute rewards for an existing lobby that users have joined',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet_3 = accounts.get('wallet_3')!;
    const walletAddressArray = [wallet_1.address, wallet_2.address, wallet_3.address];

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_2.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_3.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts);
    block2.receipts[0].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');
    block2.receipts[1].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[1].events[0]['stx_transfer_event']['amount'], '5');
    block2.receipts[2].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[2].events[0]['stx_transfer_event']['amount'], '5');

    // (run-result (list 50 { lobby-id: uint, address: principal, score: uint, rank: uint, sum-rank-factor: uint, rank-factor: uint, rewards: uint, rac: uint, nft: (string-ascii 99)}))
    const publishManyRecords: any[] = [];
    let testarray = [...Array(3).keys()].map((x) => x + 1);
    testarray.forEach((id) => {
      let record = {
        'lobby-id': 1,
        address: walletAddressArray[id - 1],
        score: 10,
        rank: id,
        'sum-rank-factor': 9048625,
        'rank-factor': 15,
        rewards: 5,
        rac: 4,
        nft: 'nft:1',
      };
      publishManyRecords.push(record);
    });
    // console.log('publishManyRecords ', publishManyRecords);
    const args = types.list(
      publishManyRecords.map((record) => {
        return types.tuple({
          'lobby-id': types.uint(record['lobby-id']),
          address: types.principal(record.address),
          score: types.uint(record['score']),
          rank: types.uint(record['rank']),
          'sum-rank-factor': types.uint(record['sum-rank-factor']),
          'rank-factor': types.uint(record['rank-factor']),
          rewards: types.uint(record['rewards']),
          rac: types.uint(record['rac']),
          nft: types.ascii(record['nft']),
        });
      })
    );
    // console.log('args ', args);
    let block = chain.mineBlock([Tx.contractCall('trustless-rewards', 'finish-result-many', [args], deployer.address)]);
    // console.log('block ', block.receipts[0].events);
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block.receipts[0].events[0].stx_transfer_event.amount, '4'); // 4 = rac value provided by owner
    assertEquals(block.receipts[0].events[2].stx_transfer_event.amount, '4'); // 4 = rac value provided by owner
    assertEquals(block.receipts[0].events[4].stx_transfer_event.amount, '4'); // 4 = rac value provided by owner
  },
});

// failure cases
Clarinet.test({
  name: 'Ensure that owner can not publish results for a non-existent run',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    // (run-result (list 50 { lobby-id: uint, address: principal, score: uint, rank: uint, sum-rank-factor: uint, rank-factor: uint, rewards: uint, rac: uint, nft: (string-ascii 99)}))
    const publishManyRecords: any[] = [];
    let testarray = [...Array(3).keys()].map((x) => x + 1);
    testarray.forEach((id) => {
      let record = {
        'lobby-id': id,
        address: wallet_1.address,
        score: 10,
        rank: 1,
        'sum-rank-factor': 45,
        'rank-factor': 15,
        rewards: 123,
        rac: 321,
        nft: 'nft:1',
      };
      publishManyRecords.push(record);
    });
    // console.log('publishManyRecords ', publishManyRecords);
    const args = types.list(
      publishManyRecords.map((record) => {
        return types.tuple({
          'lobby-id': types.uint(record['lobby-id']),
          address: types.principal(record.address),
          score: types.uint(record['score']),
          rank: types.uint(record['rank']),
          'sum-rank-factor': types.uint(record['sum-rank-factor']),
          'rank-factor': types.uint(record['rank-factor']),
          rewards: types.uint(record['rewards']),
          rac: types.uint(record['rac']),
          nft: types.ascii(record['nft']),
        });
      })
    );
    // console.log('args ', args);
    let block = chain.mineBlock([
      Tx.contractCall('trustless-rewards', 'publish-result-many', [args], deployer.address),
    ]);
    // console.log('block ', block);
    assertEquals(block.receipts.length, 0);
    // block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: 'Ensure that anyone can create lobbies',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet_3 = accounts.get('wallet_3')!;
    const walletAddressArray = [wallet_1.address, wallet_2.address, wallet_3.address];

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        wallet_1.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: 'Ensure that non-owner can not finish results and distribute rewards for an existing lobby that users have joined',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;
    const wallet_3 = accounts.get('wallet_3')!;
    const walletAddressArray = [wallet_1.address, wallet_2.address, wallet_3.address];

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_2.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_3.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts);
    block2.receipts[0].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');
    block2.receipts[1].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[1].events[0]['stx_transfer_event']['amount'], '5');
    block2.receipts[2].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[2].events[0]['stx_transfer_event']['amount'], '5');

    // (run-result (list 50 { lobby-id: uint, address: principal, score: uint, rank: uint, sum-rank-factor: uint, rank-factor: uint, rewards: uint, rac: uint, nft: (string-ascii 99)}))
    const publishManyRecords: any[] = [];
    let testarray = [...Array(3).keys()].map((x) => x + 1);
    testarray.forEach((id) => {
      let record = {
        'lobby-id': 1,
        address: walletAddressArray[id - 1],
        score: 10,
        rank: id,
        'sum-rank-factor': 45,
        'rank-factor': 15,
        rewards: 5,
        rac: 4,
        nft: 'nft:1',
      };
      publishManyRecords.push(record);
    });
    // console.log('publishManyRecords ', publishManyRecords);
    const args = types.list(
      publishManyRecords.map((record) => {
        return types.tuple({
          'lobby-id': types.uint(record['lobby-id']),
          address: types.principal(record.address),
          score: types.uint(record['score']),
          rank: types.uint(record['rank']),
          'sum-rank-factor': types.uint(record['sum-rank-factor']),
          'rank-factor': types.uint(record['rank-factor']),
          rewards: types.uint(record['rewards']),
          rac: types.uint(record['rac']),
          nft: types.ascii(record['nft']),
        });
      })
    );
    // console.log('args ', args);
    let block = chain.mineBlock([Tx.contractCall('trustless-rewards', 'finish-result-many', [args], wallet_1.address)]);
    // console.log('block ', block.receipts[0].events);
    block.receipts[0].result.expectErr().expectUint(401);
  },
});

// safety functions
Clarinet.test({
  name: 'Ensure that owner can transfer stx from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts[0].events);
    block2.receipts[0].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'transfer-stx',
        [
          types.principal(wallet_1.address),
          types.uint(5), // lobby id
        ],
        deployer.address
      ),
    ]);
    // console.log('block ', block.receipts[0].events);
    block.receipts[0].result.expectOk().expectBool(true);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');
  },
});

Clarinet.test({
  name: 'Ensure that non-owner users can not transfer stx from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'create-lobby',
        [
          types.ascii(`lobby description`), // description
          types.uint(5), // price
          types.uint(5), // factor
          types.uint(5), // commission
          types.ascii(`miamiBeach`), // mapy
          types.ascii(`long`), // length
          types.ascii(`intense`), // traffic
          types.ascii(`straight`), // curves
          types.uint(24), // hours
        ],
        deployer.address
      ),
    ]);
    block1.receipts[0].result.expectOk().expectUint(1);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'join',
        [
          types.uint(1), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log(`block2 `, block2.receipts[0].events);
    block2.receipts[0].result.expectOk().expectUint(200);
    assertEquals(block2.receipts[0].events[0]['stx_transfer_event']['amount'], '5');

    let block = chain.mineBlock([
      Tx.contractCall(
        'trustless-rewards',
        'transfer-stx',
        [
          types.principal(wallet_1.address),
          types.uint(5), // lobby id
        ],
        wallet_1.address
      ),
    ]);
    // console.log('block ', block.receipts[0].events);
    block.receipts[0].result.expectErr().expectUint(401);
    // assertEquals(block2.receipts[0].events[0]["stx_transfer_event"]["amount"], "5");
  },
});

Clarinet.test({
  name: 'Ensure that owner can set a new owner',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall('trustless-rewards', 'set-owner', [types.principal(wallet_1.address)], deployer.address),
    ]);
    block1.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: 'Ensure that non-owner users can not set a new owner',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall('trustless-rewards', 'set-owner', [types.principal(wallet_1.address)], wallet_1.address),
    ]);
    block1.receipts[0].result.expectErr().expectUint(401);
  },
});

Clarinet.test({
  name: 'Ensure that owner can transfer ft from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'ft',
        'transfer',
        // (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)
        [
          types.uint(5),
          types.principal(deployer.address),
          types.principal(deployer.address + '.trustless-rewards'),
          types.none(),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'transfer-ft-token',
        [types.principal(wallet_1.address), types.uint(5), types.principal(deployer.address + '.ft')],
        deployer.address
      ),
    ]);
    // console.log('block1 ', block1, block1.receipts[0].events);
    block1.receipts[0].result.expectOk().expectBool(true);
    block1.receipts[1].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: 'Ensure that non-owner can not transfer ft from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'ft',
        'transfer',
        // (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)
        [
          types.uint(5),
          types.principal(deployer.address),
          types.principal(deployer.address + '.trustless-rewards'),
          types.none(),
        ],
        deployer.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'transfer-ft-token',
        [types.principal(wallet_1.address), types.uint(5), types.principal(deployer.address + '.ft')],
        wallet_1.address
      ),
    ]);
    // console.log('block1 ', block1, block1.receipts[0].events);
    block1.receipts[0].result.expectOk().expectBool(true);
    block1.receipts[1].result.expectErr().expectUint(401);
  },
});

Clarinet.test({
  name: 'Ensure that owner can transfer nft from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'nft',
        'transfer',
        // (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)
        [types.uint(1), types.principal(deployer.address), types.principal(deployer.address + '.trustless-rewards')],
        deployer.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'transfer-nft-token',
        [types.principal(wallet_1.address), types.uint(1), types.principal(deployer.address + '.nft')],
        deployer.address
      ),
    ]);
    // console.log('block1 ', block1, block1.receipts[0].events);
    block1.receipts[0].result.expectOk().expectBool(true);
    block1.receipts[1].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: 'Ensure that non-owner can not transfer nft from contract',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    const wallet_2 = accounts.get('wallet_2')!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        'nft',
        'transfer',
        // (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)
        [types.uint(1), types.principal(deployer.address), types.principal(deployer.address + '.trustless-rewards')],
        deployer.address
      ),
      Tx.contractCall(
        'trustless-rewards',
        'transfer-nft-token',
        [types.principal(wallet_1.address), types.uint(1), types.principal(deployer.address + '.nft')],
        wallet_1.address
      ),
    ]);
    // console.log('block1 ', block1, block1.receipts[0].events);
    block1.receipts[0].result.expectOk().expectBool(true);
    block1.receipts[1].result.expectErr().expectUint(401);
  },
});
