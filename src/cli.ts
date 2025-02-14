#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'

interface RouteInfo {
  path: string
  type: 'page' | 'layout' | 'not-found' | 'loading' | 'error'
  children?: RouteInfo[]
}

function generateRoutes(routesDirectory: string = './app'): RouteInfo[] {
  function traverseDirectory(
    dirPath: string,
    currentPath: string = '',
  ): RouteInfo[] {
    const entries = fs.readdirSync(dirPath)
    const directoryRoutes: RouteInfo[] = []

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry)
      const relativePath = path.join(currentPath, entry)

      if (fs.statSync(fullPath).isDirectory()) {
        const routeInfo: RouteInfo = {
          path: relativePath,
          type: 'page',
          children: traverseDirectory(fullPath, relativePath),
        }

        const specialFiles = [
          'page.tsx',
          'page.js',
          'layout.tsx',
          'layout.js',
          'loading.tsx',
          'loading.js',
          'not-found.tsx',
          'not-found.js',
          'error.tsx',
          'error.js',
        ]

        specialFiles.forEach((file) => {
          if (fs.existsSync(path.join(fullPath, file))) {
            const fileType = file.split('.')[0]
            switch (fileType) {
              case 'page':
                routeInfo.type = 'page'
                break
              case 'layout':
                routeInfo.type = 'layout'
                break
              case 'loading':
                routeInfo.type = 'loading'
                break
              case 'not-found':
                routeInfo.type = 'not-found'
                break
              case 'error':
                routeInfo.type = 'error'
                break
            }
          }
        })

        directoryRoutes.push(routeInfo)
      }
    })

    return directoryRoutes
  }

  const cachePath = path.join(os.tmpdir(), 'nextjs-routes-visualizer')
  fs.mkdirSync(cachePath, { recursive: true })

  const routes = traverseDirectory(routesDirectory)
  const cacheFile = path.join(cachePath, 'routes.json')
  fs.writeFileSync(cacheFile, JSON.stringify(routes, null, 2))

  console.log(`Routes generated at ${cacheFile}`)
  return routes
}

generateRoutes()
