========
Overview
========

Shares of the ETH pool are represented by an ERC20 token. Initially, they map
1:1 to eth, but once rewards are deposited, they'll start to map to more than 1
eth per 1 share (POOL token)

This satisfies the original requirement of having users only receive rewards deposited after they deposited into the pool, since rewards make the tokens users already hold more valuable. The proper 'proof' is in the test suite ``proposed example 2``.
