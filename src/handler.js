const client = require('../src/db/index')
const { customAlphabet } = require('nanoid')
const books = require('./books')

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

  const { error, value } = schema.validate({ name, year }, { abortEarly: false })

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

  function mapFun (name) {
    const mapped = name.map(({ id, name, publisher }) => ({ id, name, publisher }))

    return mapped
  }

  if (name === 'Dicoding' || name === 'dicoding') {
    const arr2 = [{
      name: 'Dicoding'
    }, {
      name: 'dicoding'
    }]
    // const book = books.filter(book => book.name.toLowerCase().includes(name))
    const output = books.filter(({ name }) => arr2.some((item) => name.includes(item.name)))
    const bookss = mapFun(output)
    const response = h.response({
      status: 'success',
      data: {
        books: bookss
      }
    })

    response.code(200)
    return response
  }

  if (reading === '1') {
    const book = books.filter((bo) => bo.reading === true)
    const bookss = mapFun(book)
    const response = h.response({
      status: 'success',
      data: {
        books: bookss
      }
    })

    response.code(200)
    return response
  }

  if (reading === '0') {
    const book = books.filter((bo) => bo.reading === false)
    const bookss = mapFun(book)
    const response = h.response({
      status: 'success',
      data: {
        books: bookss
      }
    })

    response.code(200)
    return response
  }

  if (finished === '0') {
    const book = books.filter((bo) => bo.finished === false)
    const bookss = mapFun(book)
    const response = h.response({
      status: 'success',
      data: {
        books: bookss
      }
    })

    response.code(200)
    return response
  }

  if (finished === '1') {
    const book = books.filter((bo) => bo.finished === true)
    const bookss = mapFun(book)
    const response = h.response({
      status: 'success',
      data: {
        books: bookss
      }
    })

    response.code(200)
    return response
  }

  // const bookss = mapFun(books)
  const allBooks = await client.query('SELECT * FROM users')

  const response = h.response({
    status: 'success',
    message: allBooks.rows
  })

  return response
}

const getBookByIdHandler = (request, h) => {
  const { bookId } = request.params

  const book = books.filter((book) => book.id === bookId)[0]

  if (book !== undefined) {
    const response = h.response({
      status: 'success',
      data: {
        book
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

const updateBookByIdHandler = (request, h) => {
  const { bookId } = request.params
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload

  const index = books.findIndex((book) => book.id === bookId)
  const updatedAt = new Date().toISOString()

  if (index !== -1) {
    if (name === '' | name === undefined | name < 1) {
      const response = h.response({
        status: 'fail',
        message: 'Gagal memperbarui buku. Mohon isi nama buku'
      })

      response.code(400)
      return response
    }

    if (readPage > pageCount) {
      const response = h.response({
        status: 'fail',
        message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
      })

      response.code(400)
      return response
    }

    books[index] = {
      ...books[index],
      name,
      year,
      author,
      summary,
      publisher,
      pageCount,
      readPage,
      reading,
      updatedAt
    }

    const response = h.response({
      status: 'success',
      message: 'Buku berhasil diperbarui'
    })

    response.code(200)
    return response
  }

  const response = h.response({
    status: 'fail',
    message: 'Gagal memperbarui buku. Id tidak ditemukan'
  })

  response.code(404)
  return response
}

const deleteBookByIdHandler = (request, h) => {
  const { bookId } = request.params

  const index = books.findIndex((book) => book.id === bookId)

  if (bookId) {
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

  if (index !== -1) {
    books.splice(index, 1)

    const response = h.response({
      status: 'success',
      message: 'Buku berhasil dihapus'
    })

    response.code(200)
    return response
  }

  const response = h.response({
    status: 'fail',
    message: 'Buku gagal dihapus. Id tidak ditemukan'
  })

  response.code(404)
  return response
}

module.exports = { storeBookHandler, showAllBooks, getBookByIdHandler, updateBookByIdHandler, deleteBookByIdHandler }
