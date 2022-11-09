import { Buffer } from 'buffer'
import reverse from 'buffer-reverse'
import SHA256 from 'crypto-js/sha256'
import treeify from 'treeify'
import Base from './Base'

const _ = require('lodash');

// TODO: Clean up and DRY up code
// Disclaimer: The multiproof code is unaudited and may possibly contain serious issues. It's in a hacky state as is and it's begging for a rewrite!
const SHA256F = require('crypto-js/sha256')
type TValue = Buffer | string | number | null | undefined
type THashFnResult = Buffer | string
type THashFn = (value: TValue) => Buffer
type TLeaf = Buffer
type TLeafPref = {
  leaf: Buffer;
  vote: Array<Array<[string, number]>>;
};
type TLayer = any
//type TFillDefaultHash = (idx?: number, hashFn?: THashFn) => THashFnResult
type TFillDefaultHash = boolean

export interface Options {
  /** If set to `true`, an odd node will be duplicated and combined to make a pair to generate the layer hash. */
  duplicateOdd?: boolean
  /** If set to `true`, the leaves will hashed using the set hashing algorithms. */
  hashLeaves?: boolean
  /** If set to `true`, constructs the Merkle Tree using the [Bitcoin Merkle Tree implementation](http://www.righto.com/2014/02/bitcoin-mining-hard-way-algorithms.html). Enable it when you need to replicate Bitcoin constructed Merkle Trees. In Bitcoin Merkle Trees, single nodes are combined with themselves, and each output hash is hashed again. */
  isBitcoinTree?: boolean
  /** If set to `true`, the leaves will be sorted. */
  sortLeaves?: boolean
  /** If set to `true`, the hashing pairs will be sorted. */
  sortPairs?: boolean
  /** If set to `true`, the leaves and hashing pairs will be sorted. */
  sort?: boolean
  /** If defined, the resulting hash of this function will be used to fill in odd numbered layers. */
  //fillDefaultHash?: TFillDefaultHash | Buffer | string
  fillDefaultHash?: boolean
}

/**
 * Class reprensenting a Merkle Tree
 * @namespace MerkleTreePrefix
 */
export class MerkleTreePrefix extends Base {
  private duplicateOdd: boolean = false
  private hashFn: THashFn
  private hashLeaves: boolean = false
  private isBitcoinTree: boolean = false
  private leaves: TLeafPref[] = []
   layers: TLayer[] = []
  private sortLeaves: boolean = false
  private sortPairs: boolean = false
  private sort: boolean = false
  private fillDefaultHash: boolean | null = null

  private hashFnPref(leaf : TLeafPref){
    leaf.leaf = this.hashFn(leaf.leaf)
    return leaf
  }

  /**
   * @desc Constructs a Merkle Tree.
   * All nodes and leaves are stored as Buffers.
   * Lonely leaf nodes are promoted to the next level up without being hashed again.
   * @param {Buffer[]} leaves - Array of hashed leaves. Each leaf must be a Buffer.
   * @param {Function} hashFunction - Hash function to use for hashing leaves and nodes
   * @param {Object} options - Additional options
   * @example
   *```js
   *const MerkleTreePrefix = require('merkletreePrefixjs')
   *const crypto = require('crypto')
   *
   *function sha256(data) {
   *  // returns Buffer
   *  return crypto.createHash('sha256').update(data).digest()
   *}
   *
   *const leaves = ['a', 'b', 'c'].map(value => keccak(value))
   *
   *const tree = new MerkleTreePrefix(leaves, sha256)
   *```
   */
  constructor (leaves: any[], hashFn = SHA256, options: Options = {}) {
    super()
    this.isBitcoinTree = !!options.isBitcoinTree
    this.hashLeaves = !!options.hashLeaves
    this.sortLeaves = !!options.sortLeaves
    this.sortPairs = !!options.sortPairs


    this.fillDefaultHash = options.fillDefaultHash
    /*if (options.fillDefaultHash) {
      if (typeof options.fillDefaultHash === 'function') {
        this.fillDefaultHash = options.fillDefaultHash
      } else if (Buffer.isBuffer(options.fillDefaultHash) || typeof options.fillDefaultHash === 'string') {
        this.fillDefaultHash = (idx?: number, hashFn?: THashFn):THashFnResult => options.fillDefaultHash as THashFnResult
      } else {
        throw new Error('method "fillDefaultHash" must be a function, Buffer, or string')
      }
    }*/

    this.sort = !!options.sort
    if (this.sort) {
      this.sortLeaves = true
      this.sortPairs = true
    }

    this.duplicateOdd = !!options.duplicateOdd

    this.hashFn = this.bufferifyFn(hashFn)
    this.processLeaves(leaves)
  }

  private processLeaves (leaves: TLeafPref[]) {
    if (this.hashLeaves) {
      leaves = leaves.map(this.hashFnPref)
    }

    this.leaves = leaves.map((leaf:TLeafPref) => ({leaf: this.bufferify(leaf.leaf), vote: leaf.vote}))
    /*this.leaves = leaves.map(this.bufferify)
    if (this.sortLeaves) {
      this.leaves = this.leaves.sort(Buffer.compare)
    } */

    if (this.fillDefaultHash) {
      for (let i = 0; i < Math.pow(2, Math.ceil(Math.log2(this.leaves.length))); i++) {
        if (i >= this.leaves.length) {
          const emptyl = SHA256F("") 
          const emptyMap = new Array<Array<[string, number]>>([]);
          
          const emptyLeaf : TLeafPref = {leaf: this.bufferify(emptyl), vote: emptyMap}

      
          this.leaves.push(emptyLeaf)
        }
      }
    } 

    this.layers = [this.leaves]
    this._createHashes(this.leaves)
  }

  private _createHashes (nodes: TLeafPref[]) {

   

    console.log(this.layers)
    while (nodes.length > 1) {
      const layerIndex = this.layers.length

      this.layers.push([])
      //console.log(this.layers)
  
      console.log(" for (let i = 0; i < nodes.length; i += 2) {")
      for (let i = 0; i < nodes.length; i += 2) {
        //console.log("i=" + i)
        //console.log(this.layers)
        if (i + 1 === nodes.length) {
          if (nodes.length % 2 === 1) {
            let data = nodes[nodes.length - 1]
            let hash = data

            // is bitcoin tree
            if (this.isBitcoinTree) {
              /*TODO/ Bitcoin method of duplicating the odd ending nodes
              data = Buffer.concat([reverse(data), reverse(data)])
              hash = this.hashFn(data)
              hash = reverse(this.hashFn(hash))

              this.layers[layerIndex].push(hash)
              */
              continue
            } else {
              if (this.duplicateOdd) {
                // continue with creating layer
              } else {
                // push copy of hash and continue iteration
                //console.log("Push-1")
                //console.log(this.layers)
                //console.log(nodes[i])
                const Emptyll = SHA256F("0") 
                const EmptymyMap = new Array<Array<[string, number]>>([
                ]);
                const EmptyLeaf : TLeafPref = {leaf: Emptyll , 
                  vote: EmptymyMap}
                this.layers[layerIndex].push(EmptyLeaf)
                //console.log("Push-2")
                //console.log(this.layers)
                continue
              }
            }
          }
        }

        const left = nodes[i]
        const right = i + 1 === nodes.length ? left : nodes[i + 1]
        let dataleaf = null
        let combined = null
        let datavote = []
        

        if (this.isBitcoinTree) {
          combined = [reverse(left), reverse(right)]
        } else {
          combined = [left, right]
        }

        if (this.sortPairs) {
          combined.sort(Buffer.compare)
        }

        //let vote = Object.assign([], combined[0].vote);
        let vote = _.cloneDeep(combined[0].vote)

   

       /*vote = combined[0].vote.forEach((x) => {
                  vote.push(Object.assign({}, x));
                })
                */

        for (let ij = 0; ij < combined[0].vote[0].length ; ij += 1){
 
          datavote[SHA256F(combined[0].vote[0][ij][0])] = combined[0].vote[0][ij][1]
        }
        for (let ijj = 0; ijj < combined[1].vote[0].length ; ijj +=1){
          if(datavote[SHA256F(combined[1].vote[0][ijj][0])] == undefined){
            vote[0].push(combined[1].vote[0][ijj])
          }
          else{
            for (let j = 0; j <vote[0].length; j +=1){
              if(vote[0][j][0] == combined[1].vote[0][ijj][0]){
                vote[0][j][1] += combined[1].vote[0][ijj][1]
                break
              }
            }
            
          }
          datavote[SHA256F(combined[1].vote[0][ijj][0])] += combined[1].vote[0][ijj][1]
          
        }

        /*TODO criar id para ordenar/ ordenar alguma forma ou hashmap etc. Transformar em array  
        datavote = Object.assign([], combined[0].vote);

        console.log("datavote")
        console.log(datavote)
        console.log(combined[0].vote[0])
        console.log(combined[0].vote[0][1])
        console.log(combined[1].vote[0][1])
        console.log(nodes)

        for (let ii = 0; ii < datavote.length ; ii = ii + 1) {
          console.log("datawwwwwwwwwww")
          var temNasDuas = false;
              console.log(datavote[ii][0])
              console.log(nodes)

          for (let ij = 0; ij < combined[1].vote.length ; ij = +1) {
            if (datavote[ii][0] === combined[1].vote[ij][0]){
              console.log("datadgvrfedhbfrd")
              console.log(combined[0].vote)
              temNasDuas = true;
              console.log(datavote)
              console.log(datavote[ii][1])
              datavote[ii][1] =  parseInt(datavote[ii][1]) + parseInt(combined[1].vote[ij][1])
              console.log(datavote[ii][1])
              console.log(datavote)
              break
            }
          }
          if (!temNasDuas){
            console.log("datavote- não tem nas duas")
            console.log(datavote)
            const combinedCopy = Object.assign([], combined[0].vote[ii]);
            datavote = datavote.concat(...combinedCopy)
            datavote = datavote.push(["a", 1])
            datavote[-1][0] =  combined[0].vote[ii][0]
            datavote[-1][1] =  combined[0].vote[ii][1]
            console.log(datavote)
          }
        }

        for (let ji = 0; ji < combined[1].vote.length ; ji =+ 1) {
          var temNasDuas = false;
          for (let jj = 0; jj < combined[0].vote.length ; jj =+ 1) {
            if (datavote[ji][0] === combined[0].vote[jj][0]){
              temNasDuas = true;
              break
            }
          }
          if (!temNasDuas){
            const combinedCopy = Object.assign([], combined[0].vote[ji])
            datavote = datavote.push(["a", 1])
            datavote[-1][0] =  combined[0].vote[ji][0]
            datavote[-1][1] =  combined[0].vote[ji][1]
            
          }
        }

        //datavote = datavote.sort()
        */
      
        dataleaf = Buffer.concat([Buffer.from(Array.from(datavote)),this.bufferify(combined[0].leaf), this.bufferify(combined[1].leaf) ], 3)
        let hash = this.hashFn(dataleaf)

        // double hash if bitcoin tree
        if (this.isBitcoinTree) {
          hash = reverse(this.hashFn(hash))
        }

        var m =  Object.assign([], vote)
        const newLeaf:  TLeafPref = {
          leaf: hash,
          vote: m
        } 

        this.layers[layerIndex].push(newLeaf)
      }

      nodes = this.layers[layerIndex]
    }
  }

  /**
   * addLeaf
   * @desc Adds a leaf to the tree and re-calculates layers.
   * @param {String|Buffer} - Leaf
   * @param {Boolean} - Set to true if the leaf should be hashed before being added to tree.
   * @example
   *```js
   *tree.addLeaf(newLeaf)
   *```
   */
  addLeaf (leaf: TLeafPref, shouldHash: boolean = false) {
    if (shouldHash) {
      leaf.leaf = this.hashFn(leaf.leaf)
    }
    this.processLeaves(this.leaves.concat(leaf))
  }

  /**
   * addLeaves
   * @desc Adds multiple leaves to the tree and re-calculates layers.
   * @param {String[]|Buffer[]} - Array of leaves
   * @param {Boolean} - Set to true if the leaves should be hashed before being added to tree.
   * @example
   *```js
   *tree.addLeaves(newLeaves)
   *```
   */
  addLeaves (leaves: TLeafPref[], shouldHash: boolean = false) {
    if (shouldHash) {
      leaves = leaves.map(this.hashFnPref)
    }
    this.processLeaves(this.leaves.concat(leaves))
  }

  /**
   * getLeaves
   * @desc Returns array of leaves of Merkle Tree.
   * @return {Buffer[]}
   * @example
   *```js
   *const leaves = tree.getLeaves()
   *```
   */
   /*TODO getLeaves (values?: any[]):Buffer[] {
    if (Array.isArray(values)) {
      if (this.hashLeaves) {
        values = values.map(this.hashFn)
        if (this.sortLeaves) {
          values = values.sort(Buffer.compare)
        }
      }

      return this.leaves.filter(leaf => this._bufferIndexOf(values, leaf) !== -1)
    }

    return this.leaves
  }
  */
  /**
   * getLeaf
   * @desc Returns the leaf at the given index.
   * @param {Number} - Index number
   * @return {Buffer}
   * @example
   *```js
   *const leaf = tree.getLeaf(1)
   *```
   */
   getLeaf (index: number):TLeafPref {
    if (index < 0 || index > this.leaves.length - 1) {
      return  {
        leaf: Buffer.from([]),
        vote: null
      }
    }

    return this.leaves[index]
  }
  
  /**
   * getLeafIndex
   * @desc Returns the index of the given leaf, or -1 if the leaf is not found.
   * @param {String|Buffer} - Target leaf
   * @return {number}
   * @example
   *```js
   *const leaf = Buffer.from('abc')
   *const index = tree.getLeafIndex(leaf)
   *```
   */
   /*TODO/ getLeafIndex (target: TLeaf):number {
    target = this.bufferify(target)
    const leaves = this.getLeaves()
    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i]
      if (leaf.equals(target)) {
        return i
      }
    }

    return -1
  }
  */
  /**
   * getLeafCount
   * @desc Returns the total number of leaves.
   * @return {number}
   * @example
   *```js
   *const count = tree.getLeafCount()
   *```
   */
  getLeafCount (): number {
    return this.leaves.length
  }

  /**
   * getHexLeaves
   * @desc Returns array of leaves of Merkle Tree as hex strings.
   * @return {String[]}
   * @example
   *```js
   *const leaves = tree.getHexLeaves()
   *```
   */
  getHexLeaves ():object[] { 
    return this.leaves.map(l => ({ 
      leaf: this.bufferToHex(l.leaf), 
      vote: JSON.stringify(l.vote) 
    })) 
  }

  /**
   * marshalLeaves
   * @desc Returns array of leaves of Merkle Tree as a JSON string.
   * @param {String[]|Buffer[]} - Merkle tree leaves
   * @return {String} - List of leaves as JSON string
   * @example
   *```js
   *const jsonStr = MerkleTreePrefix.marshalLeaves(leaves)
   *```
   */
  static marshalLeaves (leaves: any[]):string {
    return JSON.stringify(leaves.map(leaf => MerkleTreePrefix.bufferToHex(leaf)), null, 2)
  }

  /**
   * unmarshalLeaves
   * @desc Returns array of leaves of Merkle Tree as a Buffers.
   * @param {String|Object} - JSON stringified leaves
   * @return {Buffer[]} - Unmarshalled list of leaves
   * @example
   *```js
   *const leaves = MerkleTreePrefix.unmarshalLeaves(jsonStr)
   *```
   */
  static unmarshalLeaves (jsonStr: string | object):Buffer[] {
    let parsed :any = null
    if (typeof jsonStr === 'string') {
      parsed = JSON.parse(jsonStr)
    } else if (jsonStr instanceof Object) {
      parsed = jsonStr
    } else {
      throw new Error('Expected type of string or object')
    }

    if (!parsed) {
      return []
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON string to be array')
    }

    return parsed.map(MerkleTreePrefix.bufferify)
  }

  /**
   * getLayers
   * @desc Returns multi-dimensional array of all layers of Merkle Tree, including leaves and root.
   * @return {Buffer[]}
   * @example
   *```js
   *const layers = tree.getLayers()
   *```
   */
  getLayers ():Buffer[] {
    return this.layers
  }

  /**
   * getHexLayers
   * @desc Returns multi-dimensional array of all layers of Merkle Tree, including leaves and root as hex strings.
   * @return {String[]}
   * @example
   *```js
   *const layers = tree.getHexLayers()
   *```
   */
  getHexLayers ():string[] {
    return this.layers.reduce((acc: string[][], item: Buffer[]) => {
      if (Array.isArray(item)) {
        acc.push(item.map(layer => this.bufferToHex(layer)))
      } else {
        acc.push(item)
      }

      return acc
    }, [])
  }

  /**
   * getLayersFlat
   * @desc Returns single flat array of all layers of Merkle Tree, including leaves and root.
   * @return {Buffer[]}
   * @example
   *```js
   *const layers = tree.getLayersFlat()
   *```
   */
  getLayersFlat ():Buffer[] {
    const layers = this.layers.reduce((acc, item) => {
      if (Array.isArray(item)) {
        acc.unshift(...item)
      } else {
        acc.unshift(item)
      }

      return acc
    }, [])

    layers.unshift(Buffer.from([0]))

    return layers
  }

  /**
   * getHexLayersFlat
   * @desc Returns single flat array of all layers of Merkle Tree, including leaves and root as hex string.
   * @return {String[]}
   * @example
   *```js
   *const layers = tree.getHexLayersFlat()
   *```
   */
  getHexLayersFlat ():string[] {
    return this.getLayersFlat().map(layer => this.bufferToHex(layer))
  }

  /**
   * getLayerCount
   * @desc Returns the total number of layers.
   * @return {number}
   * @example
   *```js
   *const count = tree.getLayerCount()
   *```
   */
  getLayerCount ():number {
    return this.getLayers().length
  }

  /**
   * getRoot
   * @desc Returns the Merkle root hash as a Buffer.
   * @return {Buffer}
   * @example
   *```js
   *const root = tree.getRoot()
   *```
   */
  getRoot (): TLeafPref {
    if (this.layers.length === 0) 
      return {
        leaf: Buffer.from([]),
        vote: [[]]
      }
      
    return this.layers[this.layers.length - 1][0]
  }

  /**
   * getHexRoot
   * @desc Returns the Merkle root hash as a hex string.
   * @return {String}
   * @example
   *```js
   *const root = tree.getHexRoot()
   *```
   */
   getHexRoot (): object {
   return {
      leaf: this.bufferToHex(this.getRoot().leaf),
      vote: this.getRoot().vote
    } 
  }
 
  /**
   * getProof
   * @desc Returns the proof for a target leaf.
   * @param {Buffer} leaf - Target leaf
   * @param {Number} [index] - Target leaf index in leaves array.
   * Use if there are leaves containing duplicate data in order to distinguish it.
   * @return {Object[]} - Array of objects containing a position property of type string
   * with values of 'left' or 'right' and a data property of type Buffer.
   * @example
   * ```js
   *const proof = tree.getProof(leaves[2])
   *```
   *
   * @example
   *```js
   *const leaves = ['a', 'b', 'a'].map(value => keccak(value))
   *const tree = new MerkleTreePrefix(leaves, keccak)
   *const proof = tree.getProof(leaves[2], 2)
   *```
   */
   // TODO
  getProof (leaf: TLeafPref , index?: number):any[] {
    if (typeof leaf === 'undefined') {
      throw new Error('leaf is required')
    }
    if (this.hashLeaves){
      leaf.leaf = this.hashFn(leaf.leaf)
    }
    const proof = []

    if (!Number.isInteger(index)) {
      index = -1

      for (let i = 0; i < this.leaves.length; i++) {
        if (Buffer.compare(leaf.leaf, this.leaves[i].leaf) === 0) {
          index = i
        }
      }
    }

    if (index <= -1) {
      return []
    }

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i]
      const isRightNode = index % 2
      const pairIndex = (isRightNode ? index - 1
        : this.isBitcoinTree && index === layer.length - 1 && i < this.layers.length - 1
          // Proof Generation for Bitcoin Trees
          ? index
          // Proof Generation for Non-Bitcoin Trees
          : index + 1)

      if (pairIndex < layer.length) {
        proof.push({
          position: isRightNode ? 'left' : 'right',
          data: layer[pairIndex]
        })
      }

      // set index to parent index
      index = (index / 2) | 0
    }

    return proof
  }
  

  /**
   * getHexProof
   * @desc Returns the proof for a target leaf as hex strings.
   * @param {Buffer} leaf - Target leaf
   * @param {Number} [index] - Target leaf index in leaves array.
   * Use if there are leaves containing duplicate data in order to distinguish it.
   * @return {String[]} - Proof array as hex strings.
   * @example
   * ```js
   *const proof = tree.getHexProof(leaves[2])
   *```
   */
   /*/TODO
  getHexProof (leaf: Buffer | string, index?: number):string[] {
    return this.getProof(leaf, index).map(item => this.bufferToHex(item.data))
  }
  */

  /**
  * getPositionalHexProof
  * @desc Returns the proof for a target leaf as hex strings and the position in binary (left == 0).
  * @param {Buffer} leaf - Target leaf
  * @param {Number} [index] - Target leaf index in leaves array.
  * Use if there are leaves containing duplicate data in order to distinguish it.
  * @return {(string | number)[][]} - Proof array as hex strings. position at index 0
  * @example
  * ```js
  *const proof = tree.getPositionalHexProof(leaves[2])
  *```
  */
  /* TODO
  getPositionalHexProof (leaf: Buffer | string, index?: number): (string | number)[][] {
    return this.getProof(leaf, index).map(item => {
      return [
        item.position === 'left' ? 0 : 1,
        this.bufferToHex(item.data)
      ]
    })
  }
  */
  /**
   * marshalProof
   * @desc Returns proof array as JSON string.
   * @param {String[]|Object[]} proof - Merkle tree proof array
   * @return {String} - Proof array as JSON string.
   * @example
   * ```js
   *const jsonStr = MerkleTreePrefix.marshalProof(proof)
   *```
   */
  static marshalProof (proof: any[]):string {
    const json = proof.map(item => {
      if (typeof item === 'string') {
        return item
      }

      if (Buffer.isBuffer(item)) {
        return MerkleTreePrefix.bufferToHex(item)
      }

      return {
        position: item.position,
        data: MerkleTreePrefix.bufferToHex(item.data)
      }
    })

    return JSON.stringify(json, null, 2)
  }

  /**
   * unmarshalProof
   * @desc Returns the proof for a target leaf as a list of Buffers.
   * @param {String|Object} - Merkle tree leaves
   * @return {String|Object} - Marshalled proof
   * @example
   * ```js
   *const proof = MerkleTreePrefix.unmarshalProof(jsonStr)
   *```
   */
  static unmarshalProof (jsonStr: string | object):any[] {
    let parsed :any = null
    if (typeof jsonStr === 'string') {
      parsed = JSON.parse(jsonStr)
    } else if (jsonStr instanceof Object) {
      parsed = jsonStr
    } else {
      throw new Error('Expected type of string or object')
    }

    if (!parsed) {
      return []
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON string to be array')
    }

    return parsed.map(item => {
      if (typeof item === 'string') {
        return MerkleTreePrefix.bufferify(item)
      } else if (item instanceof Object) {
        return {
          position: item.position,
          data: MerkleTreePrefix.bufferify(item.data)
        }
      } else {
        throw new Error('Expected item to be of type string or object')
      }
    })
  }

  /**
   * getProofIndices
   * @desc Returns the proof indices for given tree indices.
   * @param {Number[]} treeIndices - Tree indices
   * @param {Number} depth - Tree depth; number of layers.
   * @return {Number[]} - Proof indices
   * @example
   * ```js
   *const proofIndices = tree.getProofIndices([2,5,6], 4)
   *console.log(proofIndices) // [ 23, 20, 19, 8, 3 ]
   *```
   */
  getProofIndices (treeIndices: number[], depth: number):number[] {
    const leafCount = 2 ** depth
    let maximalIndices :any = new Set()
    for (const index of treeIndices) {
      let x = leafCount + index
      while (x > 1) {
        maximalIndices.add(x ^ 1)
        x = (x / 2) | 0
      }
    }

    const a = treeIndices.map(index => leafCount + index)
    const b = Array.from(maximalIndices).sort((a: any, b: any) => a - b).reverse()
    maximalIndices = a.concat(b as any)

    const redundantIndices = new Set()
    const proof = []

    for (let index of maximalIndices) {
      if (!redundantIndices.has(index)) {
        proof.push(index)
        while (index > 1) {
          redundantIndices.add(index)
          if (!redundantIndices.has(index as number ^ 1)) break
          index = (index as number / 2) | 0
        }
      }
    }

    return proof.filter(index => {
      return !treeIndices.includes(index - leafCount)
    })
  }

  private getProofIndicesForUnevenTree (sortedLeafIndices: number[], leavesCount: number): number[][] {
    const depth = Math.ceil(Math.log2(leavesCount))
    const unevenLayers :any[] = []
    for (let index = 0; index < depth; index++) {
      const unevenLayer = leavesCount % 2 !== 0
      if (unevenLayer) {
        unevenLayers.push({ index, leavesCount })
      }
      leavesCount = Math.ceil(leavesCount / 2)
    }

    const proofIndices: number[][] = []

    let layerNodes: any[] = sortedLeafIndices
    for (let layerIndex = 0; layerIndex < depth; layerIndex++) {
      const siblingIndices = layerNodes.map((index: any) => {
        if (index % 2 === 0) {
          return index + 1
        }
        return index - 1
      })
      let proofNodeIndices = siblingIndices.filter((index: any) => !layerNodes.includes(index))
      const unevenLayer = unevenLayers.find(({ index }) => index === layerIndex)
      if (unevenLayer && layerNodes.includes(unevenLayer.leavesCount - 1)) {
        proofNodeIndices = proofNodeIndices.slice(0, -1)
      }

      proofIndices.push(proofNodeIndices)
      layerNodes = [...new Set(layerNodes.map((index: any) => {
        if (index % 2 === 0) {
          return index / 2
        }

        if (index % 2 === 0) {
          return (index + 1) / 2
        }

        return (index - 1) / 2
      }))]
    }

    return proofIndices
  }

  /**
   * getMultiProof
   * @desc Returns the multiproof for given tree indices.
   * @param {Number[]} indices - Tree indices.
   * @return {Buffer[]} - Multiproofs
   * @example
   * ```js
   *const indices = [2, 5, 6]
   *const proof = tree.getMultiProof(indices)
   *```
   */
   /*
  getMultiProof (tree?: any[], indices?: any[]):Buffer[] {
    if (!indices) {
      indices = tree
      tree = this.getLayersFlat()
    }

    const isUneven = this.isUnevenTree()
    if (isUneven) {
      if (indices.every(Number.isInteger)) {
        return this.getMultiProofForUnevenTree(indices)
      }
    }

    if (!indices.every(Number.isInteger)) {
      let els = indices
      if (this.sortPairs) {
        els = els.sort(Buffer.compare)
      }

      let ids = els.map((el) => this._bufferIndexOf(this.leaves, el)).sort((a, b) => a === b ? 0 : a > b ? 1 : -1)
      if (!ids.every((idx) => idx !== -1)) {
        throw new Error('Element does not exist in Merkle tree')
      }

      const hashes = []
      const proof = []
      let nextIds = []

      for (let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i]
        for (let j = 0; j < ids.length; j++) {
          const idx = ids[j]
          const pairElement = this._getPairNode(layer, idx)

          hashes.push(layer[idx])
          if (pairElement) {
            proof.push(pairElement)
          }

          nextIds.push((idx / 2) | 0)
        }

        ids = nextIds.filter((value, i, self) => self.indexOf(value) === i)
        nextIds = []
      }

      return proof.filter((value) => !hashes.includes(value))
    }

    return this.getProofIndices(indices, this._log2((tree.length / 2) | 0)).map(index => tree[index])
  }

  private getMultiProofForUnevenTree (tree?: any[], indices?: any[]):Buffer[] {
    if (!indices) {
      indices = tree
      tree = this.getLayers()
    }

    let proofHashes : Buffer[] = []
    let currentLayerIndices: number[] = indices
    for (const treeLayer of tree) {
      const siblings: Buffer[] = []
      for (const index of currentLayerIndices) {
        if (index % 2 === 0) {
          const idx = index + 1
          if (!currentLayerIndices.includes(idx)) {
            if (treeLayer[idx]) {
              siblings.push(treeLayer[idx])
              continue
            }
          }
        }
        const idx = index - 1
        if (!currentLayerIndices.includes(idx)) {
          if (treeLayer[idx]) {
            siblings.push(treeLayer[idx])
            continue
          }
        }
      }

      proofHashes = proofHashes.concat(siblings)
      const uniqueIndices = new Set<number>()

      for (const index of currentLayerIndices) {
        if (index % 2 === 0) {
          uniqueIndices.add(index / 2)
          continue
        }

        if (index % 2 === 0) {
          uniqueIndices.add((index + 1) / 2)
          continue
        }

        uniqueIndices.add((index - 1) / 2)
      }

      currentLayerIndices = Array.from(uniqueIndices)
    }

    return proofHashes
  }
*/
  /**
   * getHexMultiProof
   * @desc Returns the multiproof for given tree indices as hex strings.
   * @param {Number[]} indices - Tree indices.
   * @return {String[]} - Multiproofs as hex strings.
   * @example
   * ```js
   *const indices = [2, 5, 6]
   *const proof = tree.getHexMultiProof(indices)
   *```
   */
  /*TODO
  getHexMultiProof (tree: Buffer[] | string[], indices: number[]):string[] {
    return this.getMultiProof(tree, indices).map((x) => this.bufferToHex(x))
  }
  */
  /**
   * getProofFlags
   * @desc Returns list of booleans where proofs should be used instead of hashing.
   * Proof flags are used in the Solidity multiproof verifiers.
   * @param {Number[]|Buffer[]} leaves
   * @param {Buffer[]} proofs
   * @return {Boolean[]} - Boolean flags
   * @example
   * ```js
   *const indices = [2, 5, 6]
   *const proof = tree.getMultiProof(indices)
   *const proofFlags = tree.getProofFlags(leaves, proof)
   *```
   */

   /* TODO
  getProofFlags (leaves: any[], proofs: Buffer[] | string[]):boolean[] {
    if (!Array.isArray(leaves) || leaves.length <= 0) {
      throw new Error('Invalid Inputs!')
    }

    let ids : number[]
    if (leaves.every(Number.isInteger)) {
      ids = leaves.sort((a, b) => a === b ? 0 : a > b ? 1 : -1) // Indices where passed
    } else {
      ids = leaves.map((el) => this._bufferIndexOf(this.leaves, el)).sort((a, b) => a === b ? 0 : a > b ? 1 : -1)
    }

    if (!ids.every((idx: number) => idx !== -1)) {
      throw new Error('Element does not exist in Merkle tree')
    }

    const _proofs: Buffer[] = (proofs as any[]).map(item => this.bufferify(item))

    const tested = []
    const flags = []
    for (let index = 0; index < this.layers.length; index++) {
      const layer = this.layers[index]
      ids = ids.reduce((ids, idx) => {
        const skipped = tested.includes(layer[idx])
        if (!skipped) {
          const pairElement = this._getPairNode(layer, idx)
          const proofUsed = _proofs.includes(layer[idx]) || _proofs.includes(pairElement)
          pairElement && flags.push(!proofUsed)
          tested.push(layer[idx])
          tested.push(pairElement)
        }
        ids.push((idx / 2) | 0)
        return ids
      }, [])
    }

    return flags
  }
*/
  /**
   * verify
   * @desc Returns true if the proof path (array of hashes) can connect the target node
   * to the Merkle root.
   * @param {Object[]} proof - Array of proof objects that should connect
   * target node to Merkle root.
   * @param {TLeafPref} targetNode - Target node Buffer
   * @param {TLeafPref} root - Merkle root Buffer
   * @return {Boolean}
   * @example
   *```js
   *const root = tree.getRoot()
   *const proof = tree.getProof(leaves[2])
   *const verified = tree.verify(proof, leaves[2], root)
   *```
   */
  verify (proof: any[], targetNode: TLeafPref, root: TLeafPref):boolean {
    const criarHash = (leftNode:TLeafPref, rightNode:TLeafPref):TLeafPref => {
      let dataleaf = null
      let combined = [leftNode, rightNode]
      let datavote = []

      let vote = _.cloneDeep(combined[0].vote)
      for (let ij = 0; ij < combined[0].vote[0].length ; ij += 1){
        datavote[SHA256F(combined[0].vote[0][ij][0])] = combined[0].vote[0][ij][1]
      }
      for (let ijj = 0; ijj < combined[1].vote[0].length ; ijj +=1){
        if(datavote[SHA256F(combined[1].vote[0][ijj][0])] == undefined){
          vote[0].push(combined[1].vote[0][ijj])
        }
        else{
          for (let j = 0; j <vote[0].length; j +=1){
            if(vote[0][j][0] == combined[1].vote[0][ijj][0]){
              vote[0][j][1] += combined[1].vote[0][ijj][1]
              break
            }
          }
        }
        datavote[SHA256F(combined[1].vote[0][ijj][0])] += combined[1].vote[0][ijj][1] 
      }
      dataleaf = Buffer.concat([Buffer.from(Array.from(datavote)),this.bufferify(combined[0].leaf), this.bufferify(combined[1].leaf) ], 3)
      let hash = this.hashFn(dataleaf)
      var m =  Object.assign([], vote)
      const newLeaf:  TLeafPref = {
        leaf: hash,
        vote: m
      } 
      return newLeaf
    } 
    
    let hash = targetNode
    if (
      !Array.isArray(proof) ||
      !targetNode ||
      !root
    ) {
      return false
    }

    for (let i = 0; i < proof.length; i++) {
      const node = proof[i]
      let data:TLeafPref = node.data
      let isLeftNode = node.position === 'left'

      const buffers: TLeafPref[] = []

      buffers.push(hash)
      buffers[isLeftNode ? 'unshift' : 'push'](data)
      
      hash = criarHash(buffers[0], buffers[1])
      console.log(`${this.bufferToHex((buffers[0].leaf))} + ${this.bufferToHex((buffers[1].leaf))} = ${this.bufferToHex(hash.leaf)}`)
    }

    return Buffer.compare(hash.leaf, root.leaf) === 0
  }

  /**
   * verifyMultiProof
   * @desc Returns true if the multiproofs can connect the leaves to the Merkle root.
   * @param {Buffer} root - Merkle tree root
   * @param {Number[]} proofIndices - Leave indices for proof
   * @param {Buffer[]} proofLeaves - Leaf values at indices for proof
   * @param {Number} leavesCount - Count of original leaves
   * @param {Buffer[]} proof - Multiproofs given indices
   * @return {Boolean}
   * @example
   *```js
   *const leaves = tree.getLeaves()
   *const root = tree.getRoot()
   *const treeFlat = tree.getLayersFlat()
   *const leavesCount = leaves.length
   *const proofIndices = [2, 5, 6]
   *const proofLeaves = proofIndices.map(i => leaves[i])
   *const proof = tree.getMultiProof(treeFlat, indices)
   *const verified = tree.verifyMultiProof(root, proofIndices, proofLeaves, leavesCount, proof)
   *```
   */
  verifyMultiProof (root: Buffer | string, proofIndices: number[], proofLeaves: Buffer[] | string[], leavesCount: number, proof: Buffer[] | string[]):boolean {
    const isUneven = this.isUnevenTree()
    if (isUneven) {
      // TODO: combine these functions and simplify
      return this.verifyMultiProofForUnevenTree(root, proofIndices, proofLeaves, leavesCount, proof)
    }

    const depth = Math.ceil(Math.log2(leavesCount))
    root = this.bufferify(root)
    proofLeaves = (proofLeaves as any[]).map(leaf => this.bufferify(leaf))
    proof = (proof as any[]).map(leaf => this.bufferify(leaf))

    const tree = {}
    for (const [index, leaf] of this._zip(proofIndices, proofLeaves)) {
      tree[(2 ** depth) + index] = leaf
    }
    for (const [index, proofitem] of this._zip(this.getProofIndices(proofIndices, depth), proof)) {
      tree[index] = proofitem
    }
    let indexqueue = Object.keys(tree).map(value => +value).sort((a, b) => a - b)
    indexqueue = indexqueue.slice(0, indexqueue.length - 1)
    let i = 0
    while (i < indexqueue.length) {
      const index = indexqueue[i]
      if (index >= 2 && ({}).hasOwnProperty.call(tree, index ^ 1)) {
        let pair = [tree[index - (index % 2)], tree[index - (index % 2) + 1]]
        if (this.sortPairs) {
          pair = pair.sort(Buffer.compare)
        }

        const hash = pair[1] ? this.hashFn(Buffer.concat(pair)) : pair[0]
        tree[(index / 2) | 0] = hash
        indexqueue.push((index / 2) | 0)
      }
      i += 1
    }
    return !proofIndices.length || (({}).hasOwnProperty.call(tree, 1) && tree[1].equals(root))
  }

  verifyMultiProofWithFlags (
    root: Buffer | string,
    leaves: TLeaf[],
    proofs: Buffer[] | string[],
    proofFlag: boolean[]
  ) {
    root = this.bufferify(root) as Buffer
    leaves = leaves.map(this.bufferify) as Buffer[]
    proofs = (proofs as any[]).map(this.bufferify) as Buffer[]
    const leavesLen = leaves.length
    const totalHashes = proofFlag.length
    const hashes : Buffer[] = []
    let leafPos = 0
    let hashPos = 0
    let proofPos = 0
    for (let i = 0; i < totalHashes; i++) {
      const bufA: Buffer = proofFlag[i] ? (leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++]) : proofs[proofPos++]
      const bufB : Buffer = leafPos < leavesLen ? leaves[leafPos++] : hashes[hashPos++]
      const buffers = [bufA, bufB].sort(Buffer.compare)
      hashes[i] = this.hashFn(Buffer.concat(buffers))
    }

    return Buffer.compare(hashes[totalHashes - 1], root) === 0
  }

  private verifyMultiProofForUnevenTree (root: Buffer | string, indices: number[], leaves: Buffer[] | string[], leavesCount: number, proof: Buffer[] | string[]):boolean {
    root = this.bufferify(root)
    leaves = (leaves as any[]).map(leaf => this.bufferify(leaf))
    proof = (proof as any[]).map(leaf => this.bufferify(leaf))

    const computedRoot = this.calculateRootForUnevenTree(indices, leaves, leavesCount, proof)
    return root.equals(computedRoot)
  }

  /**
   * getDepth
   * @desc Returns the tree depth (number of layers)
   * @return {Number}
   * @example
   *```js
   *const depth = tree.getDepth()
   *```
   */
  getDepth ():number {
    return this.getLayers().length - 1
  }

  /**
   * getLayersAsObject
   * @desc Returns the layers as nested objects instead of an array.
   * @example
   *```js
   *const layersObj = tree.getLayersAsObject()
   *```
   */
  getLayersAsObject ():any {
    const layers: any[] = this.getLayers().map((layer: any) => layer.map((value: any) => (Buffer.isBuffer(value.leaf) ? this.bufferToHex(value.leaf) : value.leaf)))
    const objs = []
    for (let i = 0; i < layers.length; i++) {
      const arr = []
      for (let j = 0; j < layers[i].length; j++) {
        const obj = { [layers[i][j]]: null }
        if (objs.length) {
          obj[layers[i][j]] = {}
          const a = objs.shift()
          const akey = Object.keys(a)[0]
          obj[layers[i][j]][akey] = a[akey]
          if (objs.length) {
            const b = objs.shift()
            const bkey = Object.keys(b)[0]
            obj[layers[i][j]][bkey] = b[bkey]
          }
        }

        arr.push(obj)
      }

      objs.push(...arr)
    }

    return objs[0]
  }

  /**
   * verify
   * @desc Returns true if the proof path (array of hashes) can connect the target node
   * to the Merkle root.
   * @param {Object[]} proof - Array of proof objects that should connect
   * target node to Merkle root.
   * @param {Buffer} targetNode - Target node Buffer
   * @param {Buffer} root - Merkle root Buffer
   * @param {Function} hashFunction - Hash function for hashing leaves and nodes
   * @param {Object} options - Additional options
   * @return {Boolean}
   * @example
   *```js
   *const verified = MerkleTreePrefix.verify(proof, leaf, root, sha256, options)
   *```
   */
/*   static verify (proof: any[], targetNode: TLeafPref, root: TLeafPref, hashFn = SHA256, options: Options = {}):boolean {
    const tree = new MerkleTreePrefix([], hashFn, options)
    return tree.verify(proof, targetNode, root)
  }
 */
  /**
   * getMultiProof
   * @desc Returns the multiproof for given tree indices.
   * @param {Buffer[]} tree - Tree as a flat array.
   * @param {Number[]} indices - Tree indices.
   * @return {Buffer[]} - Multiproofs
   *
   *@example
   * ```js
   *const flatTree = tree.getLayersFlat()
   *const indices = [2, 5, 6]
   *const proof = MerkleTreePrefix.getMultiProof(flatTree, indices)
   *```
   */
   /*TODO
  static getMultiProof (tree: Buffer[] | string[], indices: number[]):Buffer[] {
    const t = new MerkleTreePrefix([])
    return t.getMultiProof(tree, indices)
  }
  */
  /**
   * resetTree
   * @desc Resets the tree by clearing the leaves and layers.
   * @example
   *```js
   *tree.resetTree()
   *```
   */
  resetTree ():void {
    this.leaves = []
    this.layers = []
  }

  /**
   * getPairNode
   * @desc Returns the node at the index for given layer.
   * @param {Buffer[]} layer - Tree layer
   * @param {Number} index - Index at layer.
   * @return {Buffer} - Node
   *
   *@example
   * ```js
   *const node = tree.getPairNode(layer, index)
   *```
   */
  private _getPairNode (layer: Buffer[], idx: number):Buffer {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1

    if (pairIdx < layer.length) {
      return layer[pairIdx]
    } else {
      return null
    }
  }

  /**
   * toTreeString
   * @desc Returns a visual representation of the merkle tree as a string.
   * @return {String}
   * @example
   *```js
   *console.log(tree.toTreeString())
   *```
   */
  protected _toTreeString ():string {
    const obj = this.getLayersAsObject()
    return treeify.asTree(obj, true)
  }

  /**
   * toStringpow
   * @desc Returns a visual representation of the merkle tree as a string.
   * @example
   *```js
   *console.log(tree.toString())
   *```
   */
  toString ():string {
    return this._toTreeString()
  }

  isUnevenTree (treeLayers?: any[]) {
    const depth = treeLayers?.length || this.getDepth()
    return !this.isPowOf2(depth)
  }

  private isPowOf2 (v: number) {
    return v && !(v & (v - 1))
  }

  private calculateRootForUnevenTree (leafIndices: number[], leafHashes: any[], totalLeavesCount: number, proofHashes: any[]) {
    const leafTuples = this._zip(leafIndices, leafHashes).sort(([indexA], [indexB]) => indexA - indexB)
    const leafTupleIndices = leafTuples.map(([index]) => index)
    const proofIndices = this.getProofIndicesForUnevenTree(leafTupleIndices, totalLeavesCount)

    let nextSliceStart = 0
    const proofTuplesByLayers :any[] = []
    for (let i = 0; i < proofIndices.length; i++) {
      const indices = proofIndices[i]
      const sliceStart = nextSliceStart
      nextSliceStart += indices.length
      proofTuplesByLayers[i] = this._zip(indices, proofHashes.slice(sliceStart, nextSliceStart))
    }

    const tree = [leafTuples]
    for (let layerIndex = 0; layerIndex < proofTuplesByLayers.length; layerIndex++) {
      const currentLayer = proofTuplesByLayers[layerIndex].concat(tree[layerIndex]).sort(([indexA], [indexB]) => indexA - indexB)
        .map(([, hash]) => hash)

      const s = tree[layerIndex].map(([layerIndex]) => layerIndex)
      const parentIndices = [...new Set(s.map((index: any) => {
        if (index % 2 === 0) {
          return index / 2
        }

        if (index % 2 === 0) {
          return (index + 1) / 2
        }

        return (index - 1) / 2
      }))]

      const parentLayer: any[] = []
      for (let i = 0; i < parentIndices.length; i++) {
        const parentNodeTreeIndex = parentIndices[i]
        const bufA = currentLayer[i * 2]
        const bufB = currentLayer[i * 2 + 1]
        const hash = bufB ? this.hashFn(Buffer.concat([bufA, bufB])) : bufA
        parentLayer.push([parentNodeTreeIndex, hash])
      }

      tree.push(parentLayer)
    }

    return tree[tree.length - 1][0][1]
  }
}

if (typeof window !== 'undefined') {
  ;(window as any).MerkleTreePrefix = MerkleTreePrefix
}

export default MerkleTreePrefix

const tree = new MerkleTreePrefix([], SHA256, {fillDefaultHash: true})
const ll = SHA256F("aya") 
const myMap = new Array<Array<[string, number]>>([
  ["key1", 1],
  ["key2", 2],
]);

const myMap1 = new Array<Array<[string, number]>>([
  ["key1", 1],
  ["key3", 3]
]);


const testLeaf : TLeafPref = {leaf: ll , 
                        vote: myMap}

const testLeaf1 : TLeafPref = {leaf: ll , 
                          vote: myMap1}

console.log(testLeaf)                 
tree.addLeaf(testLeaf)
tree.addLeaf(testLeaf1)
tree.addLeaf(testLeaf)
tree.addLeaf(testLeaf)
tree.addLeaf(testLeaf1)
tree.addLeaf(testLeaf1)
console.log(tree.toString())
const a = tree.getProof(testLeaf1, 4)
console.log(tree.verify(a, tree.getLeaf(4), tree.getRoot()))
