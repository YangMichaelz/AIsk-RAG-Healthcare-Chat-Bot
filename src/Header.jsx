function Header() {
    return(
        <div className="w-full container mx-auto max-h-screen ">
        <div className="w-full flex items-center justify-between">
          <a className="flex items-center text-white no-underline hover:no-underline font-bold text-2xl lg:text-4xl" href="#">
            AI<span className="text-yellow-400">sk</span>
          </a>
          <div className="flex w-1/2 justify-end content-center"></div>
        </div>
      </div>
    )
}

export default Header
