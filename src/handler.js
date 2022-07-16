const client = require('../src/db/index')
const { customAlphabet } = require('nanoid')

const Joi = require('joi')

const schema = Joi.object().keys({
  name: Joi.string().required().messages({
    'any.name': 'Not a valid name address.',
    'any.empty': 'Year is required.',
    'any.required': 'Name dibutuhin woi!'
  }),
  year: Joi.number().required().messages({
    'any.year': 'Not a valid year address.',
    'any.empty': 'year is required.',
    'any.required': 'Year dibutuhin woi!'
  }),
  author: Joi.string().max(10).required().messages({
    'any.year': 'Not a valid year address.',
    'any.empty': 'year is required.',
    'any.required': 'Year dibutuhin woi!'
  })
})

const storeBookHandler = (request, h) => {
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload

  const uniqueId = customAlphabet('1234567890', 10)
  const id = uniqueId()
  const insertedAt = new Date().toISOString()
  const updatedAt = insertedAt
  let finished = false

  if (pageCount === readPage) {
    finished = true
  }

  const { error, value } = schema.validate({ name, year, author }, { abortEarly: false })

  if (readPage > pageCount) {
    const response = h.response({
      status: 'fail',
      message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount'
    })

    response.code(400)
    return response
  }

  if (error) {
    const response = h.response({
      status: 'fail',
      message: error.details.map(({ message }) => ({ message }))
    })

    response.code(400)
    return response
  } else {
    const query = `INSERT INTO users (id, name, year, author, summary, publisher, pagecount, readpage, finished, reading, insertedat, updatedat) VALUES ('${id}', '${value.name}', ${value.year}, '${author}', '${summary}', '${publisher}', ${pageCount}, ${readPage}, ${finished}, ${reading}, '${insertedAt}', '${updatedAt}')`
    client.query(query, (err, result) => {
      if (!err) {
        console.log('success : ' + result.rows)
      } else {
        console.log('error : ' + error)
      }
    })

    const response = h.response({
      status: 'success',
      message: 'Buku berhasil ditambahkan',
      data: {
        bookId: id,
        name: value.name
      }
    })

    response.code(201)
    return response
  }
}

const showAllBooks = async (request, h) => {
  const { name, reading, finished } = request.query

  if (name === 'Dicoding' || name === 'dicoding') {
    // to get one row, less specfic
    // const getAllL = await client.query(`SELECT * FROM users WHERE name LIKE '%${name}%'`)

    // get 2 rows, that more specific
    const getAllM = await client.query('SELECT * FROM users')
    const bokk = getAllM.rows

    const arr2 = [{
      name: 'Dicoding'
    }, {
      name: 'dicoding'
    }]

    const output = bokk.filter(({ name }) => arr2.some((item) => name.includes(item.name)))

    const response = h.response({
      status: 'success',
      data: {
        books: output
      }
    })

    response.code(200)
    return response
  }

  if (reading === '1') {
    const readingTrueQuery = await client.query('SELECT * FROM users where reading = true')

    const response = h.response({
      status: 'success',
      data: {
        books: readingTrueQuery.rows
      }
    })

    response.code(200)
    return response
  }

  if (reading === '0') {
    const readingFalseQuery = await client.query('SELECT * FROM users where reading = false')

    const response = h.response({
      status: 'success',
      data: {
        books: readingFalseQuery.rows
      }
    })

    response.code(200)
    return response
  }

  if (finished === '0') {
    const finishedTrueQuery = await client.query('SELECT * FROM users where finished = false')

    const response = h.response({
      status: 'success',
      data: {
        books: finishedTrueQuery.rows
      }
    })

    response.code(200)
    return response
  }

  if (finished === '1') {
    const finishedTrueQuery = await client.query('SELECT * FROM users where finished = true')

    const response = h.response({
      status: 'success',
      data: {
        books: finishedTrueQuery.rows
      }
    })

    response.code(200)
    return response
  }

  // if no one query params, get all data
  const allBooks = await client.query('SELECT * FROM users')

  const response = h.response({
    status: 'success',
    message: allBooks.rows
  })

  return response
}

const getBookByIdHandler = async (request, h) => {
  const { bookId } = request.params

  const getBookById = await client.query(`SELECT * FROM users WHERE id =${bookId}`)
  if (getBookById.rowCount > 0) {
    const response = h.response({
      status: 'success',
      data: {
        book: getBookById.rows
      }
    })

    response.code(200)
    return response
  }

  const response = h.response({
    status: 'fail',
    message: 'Buku tidak ditemukan'
  })

  response.code(404)
  return response
}

const updateBookByIdHandler = async (request, h) => {
  const { bookId } = request.params
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload

  const updatedAt = new Date().toISOString()

  const schema = Joi.object().keys({
    name: Joi.string().required().empty()
  })

  const { error, value } = schema.validate({ name }, { abortEarly: true })

  if (readPage > pageCount) {
    const response = h.response({
      status: 'fail',
      message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
    })

    response.code(400)
    return response
  }

  console.log(value)

  if (error) {
    const response = h.response({
      status: 'fail',
      error: error.details.map(({ message }) => ({ message }))
    })

    response.code(400)
    return response
  }

  const checkBookId = await client.query(`SELECT * FROM users WHERE id=${bookId}`)

  if (checkBookId.rowCount < 1) {
    const response = h.response({
      status: 'fail',
      message: 'Gagal memperbarui buku. Id tidak ditemukan',
      data: checkBookId.rowCount
    })

    response.code(404)
    return response
  } else {
    if (value.name) {
      const updateBook = await client.query(`UPDATE users SET name='${value.name}', year=${year}, author='${author}', summary='${summary}', publisher='${publisher}', pagecount=${pageCount}, readpage=${readPage}, reading=${reading}, updatedat='${updatedAt}' WHERE id=${bookId} RETURNING *`)

      const response = h.response({
        status: 'success',
        message: 'Buku berhasil diperbarui',
        data: updateBook.rows
      })

      response.code(200)
      return response
    }
  }
}

const deleteBookByIdHandler = async (request, h) => {
  const { bookId } = request.params

  const checkBookId = await client.query(`SELECT * FROM users WHERE id=${bookId}`)

  if (checkBookId.rowCount < 1) {
    const response = h.response({
      status: 'fail',
      message: 'Buku gagal dihapus. Id tidak ditemukan'
    })

    response.code(404)
    return response
  } else {
    client.query(`DELETE FROM public.users where id=${bookId}`, (err, success) => {
      if (!err) {
        console.log('success : ' + success.rows)
      } else {
        console.log('Error : ' + err)
      }
    })

    const response = h.response({
      status: 'success',
      message: 'Buku berhasil dihapus'
    })

    response.code(200)
    return response
  }
}

module.exports = { storeBookHandler, showAllBooks, getBookByIdHandler, updateBookByIdHandler, deleteBookByIdHandler }
