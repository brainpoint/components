const AWS = require('aws-sdk')
const Serverless = require('../../lib')

const { pack } = Serverless
const lambda = new AWS.Lambda({ region: 'us-east-1' })

const create = async ({ name, handler, memory, timeout, env, description, role }) => {
  const pkg = await pack()

  const params = {
    FunctionName: name,
    Code: {
      ZipFile: pkg
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: role,
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  const res = await lambda.createFunction(params).promise()
  return {
    arn: res.FunctionArn
  }
}

const update = async ({ name, handler, memory, timeout, env, description }) => {
  const pkg = await pack()
  const functionCodeParams = {
    FunctionName: name,
    ZipFile: pkg,
    Publish: true
  }

  const functionConfigParams = {
    FunctionName: name,
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  await lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    arn: res.FunctionArn
  }
}

const remove = async (name) => {
  const params = {
    FunctionName: name
  }

  await lambda.deleteFunction(params).promise()
  return {
    arn: null
  }
}

module.exports = async (inputs, state) => {
  let outputs
  if (inputs.name && !state.name) {
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (state.name && !inputs.name) {
    console.log(`Removing Lambda: ${state.name}`)
    outputs = await remove(state.name)
  } else if (inputs.name !== state.name) {
    console.log(`Removing Lambda: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating Lambda: ${inputs.name}`)
    outputs = await update(inputs)
  }
  return outputs
}
