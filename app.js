const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
const {isValid, parseISO, format} = require('date-fns')

app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const hasPriorityStatusAndCategoryProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  )
}
const hasPriorityStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityCategoryProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  )
}

const hasStatusCategoryProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const checkstatusget = (request, response, next) => {
  const {status = ''} = request.query
  if (
    status == 'TO DO' ||
    status == 'IN PROGRESS' ||
    status == 'DONE' ||
    status == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}
const checkpriorityget = (request, response, next) => {
  const {priority = ''} = request.query
  if (
    priority == 'HIGH' ||
    priority == 'MEDIUM' ||
    priority == 'LOW' ||
    priority == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
}

const checkcategoryget = (request, response, next) => {
  const {category = ''} = request.query
  if (
    category == 'WORK' ||
    category == 'HOME' ||
    category == 'LEARNING' ||
    category == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
}

const checkduedateget = (request, response, next) => {
  const {date = ''} = request.query
  const parsedDate = parseISO(date)
  if (isValid(parsedDate)) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
}

const checkstatuspost = (request, response, next) => {
  const {status = ''} = request.body
  if (
    status == 'TO DO' ||
    status == 'IN PROGRESS' ||
    status == 'DONE' ||
    status == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}
const checkprioritypost = (request, response, next) => {
  const {priority = ''} = request.body
  if (
    priority == 'HIGH' ||
    priority == 'MEDIUM' ||
    priority == 'LOW' ||
    priority == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
}

const checkcategorypost = (request, response, next) => {
  const {category = ''} = request.body
  if (
    category == 'WORK' ||
    category == 'HOME' ||
    category == 'LEARNING' ||
    category == ''
  ) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
}
const checkduedatepost = (request, response, next) => {
  const {dueDate = ''} = request.body
  const parsedDate = parseISO(dueDate)
  if (isValid(parsedDate) || dueDate == '') {
    next()
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
}

const convertToTODOobj = eachStatus => {
  return {
    id: eachStatus.id,
    todo: eachStatus.todo,
    priority: eachStatus.priority,
    status: eachStatus.status,
    category: eachStatus.category,
    dueDate: eachStatus.due_date,
  }
}

app.get(
  '/todos/',
  checkstatusget,
  checkpriorityget,
  checkcategoryget,
  async (request, response) => {
    const {
      status = '',
      priority = '',
      search_q = '',
      category = '',
    } = request.query
    let gettodoQuery
    switch (true) {
      case hasPriorityStatusAndCategoryProperties(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category="${category}" AND status="${status}" AND priority="${priority}" ;`
        break
      case hasPriorityStatusProperties(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status="${status}" AND priority="${priority}" ;`
        break
      case hasPriorityCategoryProperties(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category="${category}" AND priority="${priority}" ;`
        break
      case hasStatusCategoryProperties(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category="${category}" AND status="${status}" ;`
        break
      case hasStatusProperty(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"  AND status='${status}';`
        break
      case hasPriorityProperty(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority="${priority}" ;`
        break
      case hasCategoryProperty(request.query):
        gettodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND category="${category}";`
        break
      default:
        gettodoQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`
    }
    const todoArray = await db.all(gettodoQuery)
    response.send(todoArray.map(eachStatus => convertToTODOobj(eachStatus)))
  },
)

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT *
    FROM todo WHERE id=${todoId}`
  const todo = await db.get(getTodoQuery)
  response.send(convertToTODOobj(todo))
})

app.get('/agenda/', checkduedateget, async (request, response) => {
  let {date} = request.query
  date = format(new Date(date), 'yyyy-MM-dd')
  const getTodoAccDate = `SELECT *
    FROM todo WHERE due_date=${date};`
  const todoArrayWithDate = await db.all(getTodoAccDate)
  console.log(todoArrayWithDate)
  response.send(todoArrayWithDate.map(eachTODO => convertToTODOobj(eachTODO)))
})

app.post(
  '/todos/',
  checkstatuspost,
  checkprioritypost,
  checkcategorypost,
  checkduedatepost,
  async (request, response) => {
    const details = request.body
    let {id, todo, priority, status, category, dueDate} = details
    dueDate = format(new Date(dueDate), 'yyyy-MM-dd')
    const createQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}', '${dueDate}')`
    const create = await db.run(createQuery)
    response.send('Todo Successfully Added')
  },
)

app.put(
  '/todos/:todoId/',
  checkstatuspost,
  checkprioritypost,
  checkcategorypost,
  checkduedatepost,
  async (request, response) => {
    const {todoId} = request.params
    const {status, priority, todo, category, dueDate} = request.body
    let updateQuery = ''
    switch (true) {
      case category !== undefined:
        updateQuery = `UPDATE todo SET category="${category}" WHERE id = ${todoId};`
        await db.run(updateQuery)
        response.send('Category Updated')
        break
      case status !== undefined:
        updateQuery = `UPDATE todo SET status="${status}" WHERE id = ${todoId};`
        await db.run(updateQuery)
        response.send('Status Updated')
        break
      case priority !== undefined:
        updateQuery = `UPDATE todo SET priority="${priority}" WHERE id = ${todoId};`
        await db.run(updateQuery)
        response.send('Priority Updated')
        break
      case todo !== undefined:
        updateQuery = `UPDATE todo SET todo="${todo}" WHERE id = ${todoId};`
        await db.run(updateQuery)
        response.send('Todo Updated')
        break
      case dueDate !== undefined:
        updateQuery = `UPDATE todo SET due_date="${dueDate}" WHERE id = ${todoId};`
        await db.run(updateQuery)
        response.send('Due Date Updated')
        break
    }
  },
)

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
